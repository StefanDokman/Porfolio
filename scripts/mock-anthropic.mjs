// A stand-in for the Anthropic Messages API, for working on the chat locally
// without an API key or spending budget. It streams a canned answer in the same
// server-sent-events format as the real API, with citations of the real documents.
//
//   node scripts/mock-anthropic.mjs [port]      (default port 8790)
//
// Put one of these in a chat message to try other cases:
//   mock:error    the API fails (HTTP 500)
//   mock:refusal  the model declines to answer
//   mock:slow     the answer streams slowly (to try the stop button)
//   mock:long     the answer hits max_tokens and is cut off

import { createServer } from "node:http";

const port = Number(process.argv[2] || process.env.MOCK_PORT || 8790);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function summarize(body, headers) {
  const first = body.messages?.[0];
  const docs = Array.isArray(first?.content) ? first.content.filter((b) => b.type === "document") : [];
  const last = body.messages?.[body.messages.length - 1];
  const lastText = typeof last?.content === "string" ? last.content : last?.content?.findLast?.((b) => b.type === "text")?.text;
  return {
    model: body.model,
    beta: headers["anthropic-beta"] ?? null,
    fallbacks: body.fallbacks ?? null,
    effort: body.output_config?.effort ?? null,
    max_tokens: body.max_tokens,
    system_chars: typeof body.system === "string" ? body.system.length : null,
    documents: docs.length,
    cached_document: docs.findIndex((d) => d.cache_control),
    citations_on: docs.every((d) => d.citations?.enabled === true),
    turns: body.messages?.map((m) => m.role).join(","),
    question: lastText,
  };
}

function answerFor(question, docs) {
  const find = (word) => docs.findIndex((d) => (d.title || "").includes(word));
  const neuroblast = Math.max(find("Neuroblast"), 0);
  const web = find("Web Projects");
  const parts = [
    { text: "This is a mock answer from scripts/mock-anthropic.mjs, so no real AI was used. " },
    { text: `You asked: "${question.slice(0, 120)}". ` },
    { text: "Stefan builds therapeutic Unity games at Neuroblast, shown on the Neuroblast tab.", cite: neuroblast },
    { text: "\n\nThe multiplayer card games run on Cloudflare Workers and can be played at https://flip7.stefandokman.com.", cite: web },
    { text: ` For anything else, email ${"stefandokman@hotmail.com"}.` },
  ];
  return parts;
}

createServer(async (req, res) => {
  if (req.method !== "POST" || !req.url.startsWith("/v1/messages")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "not_found_error", message: "mock: not found" } }));
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw);
  const info = summarize(body, req.headers);
  console.log(`[mock-anthropic] ${JSON.stringify(info)}`);
  const question = info.question || "";

  if (question.includes("mock:error")) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "api_error", message: "mock: internal error" } }));
    return;
  }

  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
  const docs = body.messages?.[0]?.content?.filter?.((b) => b.type === "document") ?? [];
  const slow = question.includes("mock:slow");
  const long = question.includes("mock:long");
  const refusal = question.includes("mock:refusal");

  send("message_start", {
    message: {
      id: "msg_mock",
      type: "message",
      role: "assistant",
      model: body.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 40, cache_creation_input_tokens: 0, cache_read_input_tokens: 5200, output_tokens: 1 },
    },
  });
  // A thinking block with no visible text, like the real API's default.
  send("content_block_start", { index: 0, content_block: { type: "thinking", thinking: "", signature: "" } });
  await sleep(slow ? 800 : 300);
  send("content_block_delta", { index: 0, delta: { type: "signature_delta", signature: "mock-signature" } });
  send("content_block_stop", { index: 0 });

  let index = 1;
  if (!refusal) {
    const parts = answerFor(question, docs);
    if (long) parts.push({ text: " And then the answer keeps going and going until it runs out of room" });
    for (const part of parts) {
      send("content_block_start", { index, content_block: { type: "text", text: "", citations: null } });
      if (part.cite >= 0 && docs[part.cite]) {
        const doc = docs[part.cite];
        send("content_block_delta", {
          index,
          delta: {
            type: "citations_delta",
            citation: {
              type: "char_location",
              cited_text: doc.source.data.slice(0, 80),
              document_index: part.cite,
              document_title: doc.title,
              start_char_index: 0,
              end_char_index: 80,
            },
          },
        });
      }
      for (const word of part.text.match(/\S+\s*|\s+/g) ?? []) {
        if (res.destroyed) return;
        send("content_block_delta", { index, delta: { type: "text_delta", text: word } });
        await sleep(slow ? 250 : 25);
      }
      send("content_block_stop", { index });
      index++;
    }
  }
  send("message_delta", {
    delta: { stop_reason: refusal ? "refusal" : long ? "max_tokens" : "end_turn", stop_sequence: null },
    usage: { output_tokens: 180 },
  });
  send("message_stop", {});
  res.end();
}).listen(port, "127.0.0.1", () => console.log(`[mock-anthropic] listening on http://127.0.0.1:${port}`));
