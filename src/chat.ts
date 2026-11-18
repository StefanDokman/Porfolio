import Anthropic from "@anthropic-ai/sdk";
import { chatEnabled, limitsFrom, type Env } from "./env";
import { KNOWLEDGE } from "./knowledge.generated";
import { SYSTEM_PROMPT } from "./prompt";

const DEFAULT_MODEL = "claude-haiku-5-5";
// Hard cap on thinking + answer per reply. Answers are asked to be short, so this
// only matters as a cost ceiling; a cut-off answer ends with "…".
const MAX_TOKENS = 2048;
// Only the end of a conversation is sent, so long chats don't grow in cost.
const MAX_TURNS = 12;
const MAX_USER_CHARS = 1000;
const MAX_ASSISTANT_CHARS = 6000;
const MAX_BODY_BYTES = 64_000;

// Models that accept the server-side refusal fallback (a declined answer is retried on
// another model inside the same request). Other models get the request without it.
const FALLBACK_MODELS = new Set([
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
  "claude-fable-5-2",
  "claude-fable-5-1",
]);

// USD per million tokens, for the budget estimate. Cache writes (5-minute TTL) cost 1.25x input.
const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};
// Used for any other model (including a refusal fallback model): deliberately on the high side.
const UNKNOWN_PRICE = { input: 5, output: 25, cacheRead: 0.5 };

type Turn = { role: "user" | "assistant"; text: string };

interface Usage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export function estimateCostUsd(model: string, usage: Usage): number {
  const p = PRICES[model] ?? UNKNOWN_PRICE;
  const tokens =
    (usage.input_tokens ?? 0) * p.input +
    (usage.cache_creation_input_tokens ?? 0) * p.input * 1.25 +
    (usage.cache_read_input_tokens ?? 0) * p.cacheRead +
    (usage.output_tokens ?? 0) * p.output;
  return tokens / 1_000_000;
}

/** Validates the browser's conversation and keeps its last MAX_TURNS turns, starting with a visitor message. */
export function parseTurns(body: unknown): Turn[] | null {
  const list = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(list) || list.length === 0 || list.length > 50) return null;

  const turns: Turn[] = [];
  for (const item of list) {
    const role = (item as Turn)?.role;
    const text = typeof (item as Turn)?.text === "string" ? (item as Turn).text.trim() : "";
    if ((role !== "user" && role !== "assistant") || !text) return null;
    if (text.length > (role === "user" ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS)) return null;
    if (turns.length > 0 && turns[turns.length - 1].role === role) return null; // must alternate
    turns.push({ role, text });
  }
  if (turns[turns.length - 1].role !== "user") return null;

  const recent = turns.slice(-MAX_TURNS);
  while (recent[0].role !== "user") recent.shift();
  return recent;
}

function buildMessages(turns: Turn[]): Anthropic.Beta.Messages.BetaMessageParam[] {
  // Every knowledge section goes in as a citable document. They come first and never
  // change between visitors, so the system prompt plus documents are one cached prefix.
  const documents: Anthropic.Beta.Messages.BetaRequestDocumentBlock[] = KNOWLEDGE.map((doc, i) => ({
    type: "document",
    source: { type: "text", media_type: "text/plain", data: doc.text },
    title: doc.title,
    citations: { enabled: true },
    ...(i === KNOWLEDGE.length - 1 ? { cache_control: { type: "ephemeral" as const } } : {}),
  }));

  return turns.map((turn, i) =>
    i === 0
      ? { role: "user", content: [...documents, { type: "text", text: turn.text }] }
      : { role: turn.role, content: turn.text },
  );
}

async function visitorKey(ip: string): Promise<string> {
  // Salted with the UTC date, so the key changes daily; only the hash is stored, never the IP.
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`portfolio-chat:${day}:${ip}`));
  return [...new Uint8Array(digest).slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

export function handleStatus(env: Env): Response {
  return json({ enabled: chatEnabled(env) }, 200);
}

export async function handleChat(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });

  // Only the portfolio page itself may call this (browsers always send Origin on POST).
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) return json({ error: "forbidden" }, 403);

  if (!chatEnabled(env)) return json({ error: "unavailable" }, 503);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "bad_request" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const turns = parseTurns(body);
  if (!turns) return json({ error: "bad_request" }, 400);

  const guard = env.CHAT_GUARD.get(env.CHAT_GUARD.idFromName("global"));
  const visitor = await visitorKey(request.headers.get("CF-Connecting-IP") ?? "unknown");
  const verdict = await guard.admit(visitor, limitsFrom(env));
  if (!verdict.ok) return json({ error: verdict.reason }, 429);

  const model = env.CHAT_MODEL || DEFAULT_MODEL;
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: env.ANTHROPIC_BASE_URL || undefined,
    maxRetries: 1,
    timeout: 60_000,
  });

  const stream = client.beta.messages.stream({
    model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: buildMessages(turns),
    // Portfolio Q&A doesn't need deep reasoning; low effort keeps answers fast and cheap.
    output_config: { effort: "low" },
    ...(FALLBACK_MODELS.has(model)
      ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
      : {}),
  });

  // The browser gets a small server-sent-events stream of its own:
  //   {type:"text",text} ... then {type:"done",sources} or {type:"error",error}
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const send = (event: object) => writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

  const run = async () => {
    const cited: number[] = [];
    let final: Anthropic.Beta.Messages.BetaMessage | undefined;
    let errorCode: string | null = null;
    let clientGone = false;

    try {
      for await (const event of stream) {
        if (event.type !== "content_block_delta") continue;
        if (event.delta.type === "text_delta") {
          await send({ type: "text", text: event.delta.text });
        } else if (event.delta.type === "citations_delta" && "document_index" in event.delta.citation) {
          const index = event.delta.citation.document_index;
          if (!cited.includes(index)) cited.push(index);
        }
      }
      final = await stream.finalMessage();
    } catch (err) {
      if (err instanceof Anthropic.APIError && !(err instanceof Anthropic.APIUserAbortError)) {
        errorCode = err.status === 429 || err.status === 529 ? "busy" : "upstream";
        console.error(JSON.stringify({ event: "chat_api_error", status: err.status, message: err.message }));
      } else if (stream.aborted || err instanceof Anthropic.APIUserAbortError) {
        clientGone = true;
      } else {
        // Writing to the browser failed: the visitor closed the page or pressed stop.
        clientGone = true;
        stream.abort();
      }
    }

    // Charge the budget. A reply that was cut short has no final usage, so assume the worst.
    const snapshot = final ?? stream.currentMessage;
    let usd = 0;
    if (snapshot) {
      const usage = final ? final.usage : { ...snapshot.usage, output_tokens: MAX_TOKENS };
      usd = estimateCostUsd(snapshot.model, usage);
      await guard.record(usd);
    }
    console.log(
      JSON.stringify({
        event: "chat",
        model: snapshot?.model ?? model,
        stop: final?.stop_reason ?? (clientGone ? "client_gone" : errorCode),
        input: snapshot?.usage.input_tokens,
        cache_write: snapshot?.usage.cache_creation_input_tokens,
        cache_read: snapshot?.usage.cache_read_input_tokens,
        output: final?.usage.output_tokens,
        usd: Number(usd.toFixed(5)),
      }),
    );

    if (!clientGone) {
      try {
        if (errorCode) {
          await send({ type: "error", error: errorCode });
        } else if (final?.stop_reason === "refusal") {
          await send({ type: "error", error: "refusal" });
        } else {
          if (final?.stop_reason === "max_tokens") await send({ type: "text", text: " …" });
          const sources = cited
            .map((i) => KNOWLEDGE[i])
            .filter((doc) => doc !== undefined)
            .map((doc) => ({ label: doc.label, link: doc.link }))
            .filter((s, i, all) => all.findIndex((o) => o.label === s.label) === i);
          await send({ type: "done", sources });
        }
      } catch {
        // The visitor left right at the end; nothing to do.
      }
    }
    try {
      await writer.close();
    } catch {
      // Already closed by the browser.
    }
  };
  ctx.waitUntil(run());

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
