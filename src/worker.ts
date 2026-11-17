import { handleChat, handleStatus } from "./chat";
import type { Env } from "./env";

export { ChatGuard } from "./guard";

// Only /api/* reaches this code (see "run_worker_first" in wrangler.jsonc);
// everything else is served straight from the static files.
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/chat") return handleChat(request, env, ctx);
    if (pathname === "/api/chat/status") return handleStatus(env);
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
