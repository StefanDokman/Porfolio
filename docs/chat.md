# Portfolio chat

An AI assistant on the portfolio that answers visitors' questions from the files in `knowledge/`, with links back to the part of the site each answer comes from.

## How it works

- `chat.js` / `chat.css` add the "Ask AI about my work" button. The button only appears when `/api/chat/status` says the chat is enabled, i.e. once the API key is set.
- `src/worker.ts` is the site's Worker. Requests to `/api/*` run it; everything else is served as static files from the repo root, as before.
- `/api/chat` sends the system prompt (`src/prompt.ts`) plus every knowledge section to Claude and streams the answer back. The knowledge is sent in full on every request, and prompt caching makes the repeats cheap.
- `src/guard.ts` is a Durable Object that enforces the budget and per-visitor limits (see below).
- `scripts/build-knowledge.mjs` turns `knowledge/*.md` into `src/knowledge.generated.ts`. Wrangler runs it before every `dev` and `deploy`.

## Setting it up

1. **Anthropic API key.** In the Anthropic Console, create a workspace for the portfolio, set its monthly spend limit to $5, and create an API key in that workspace. The Worker estimates its own spend, but the Console limit is the hard stop.
2. **Worker name.** In the Cloudflare dashboard (Workers & Pages), check the name of the Worker that serves portfolio.stefandokman.com. If it isn't `porfolio`, change `name` in `wrangler.jsonc` to match. Otherwise the build fails, and the live site keeps its previous version.
3. **Build settings.** Open the Worker's Settings → Build. The build command should be `npm ci`, and the deploy command plain `npx wrangler deploy`. If the deploy command has flags such as `--assets`, remove them: `wrangler.jsonc` now holds that configuration.
4. **Secret.** Under Settings → Variables and Secrets, add `ANTHROPIC_API_KEY` as a **Secret** with the key from step 1. (Or run `npx wrangler secret put ANTHROPIC_API_KEY` after `npx wrangler login`.) Until it is set, the chat button stays hidden, so it's safe to deploy first.
5. **Deploy** by merging into `main`, then open the site and ask a question.

Change settings in `wrangler.jsonc`, not in the dashboard. A deploy replaces any plain variables set in the dashboard; secrets are kept.

## Settings (`wrangler.jsonc` → `vars`)

| Variable | Default | What it does |
|---|---|---|
| `CHAT_ENABLED` | `"true"` | `"false"` hides the button and turns off `/api/chat` |
| `CHAT_MODEL` | `"claude-haiku-5-5"` | Model used for answers. `"claude-sonnet-5-5"` or `"claude-opus-5-5"` write better answers at 20x or 40x the cost |
| `MONTHLY_BUDGET_USD` | `"5"` | The chat stops for the rest of the month (UTC) once its estimated spend reaches this |
| `DAILY_BUDGET_USD` | `"0.16"` | Same per UTC day. At 5/31 the monthly limit can never be reached, so heavy use or abuse turns the chat off for the rest of that day at most |
| `IP_PER_MINUTE` | `"6"` | Messages per visitor per minute |
| `IP_PER_DAY` | `"40"` | Messages per visitor per day |

When a limit is hit, the chat shows a friendly message with the email address.

## Cost

The knowledge is currently about 5,000 tokens. Rough cost per visitor conversation of about four questions:

| Model | Per conversation | Conversations for $5 |
|---|---|---|
| `claude-haiku-5-5` (current) | ~$0.002 | ~2,500 (about 80 a day under the daily cap) |
| `claude-sonnet-5-5` | ~$0.04 | ~120 |
| `claude-opus-5-5` | ~$0.08 | ~60 |

The first question in a visit costs the most, because it writes the knowledge into the 5-minute prompt cache; follow-ups read it at a twentieth of the price. More knowledge raises the cost of every message, so `npm run knowledge` prints the current token count.

## Logs

Cloudflare dashboard → the Worker → Logs. Each answer logs the model, the stop reason, the token counts and the estimated cost in USD, never the visitor's question or the answer.

## Adding knowledge

- Put Markdown files in `knowledge/`. Start each with front-matter giving a `title`.
- Every `## ` section becomes one source the chat can cite. Under a heading, `<!-- link: #neuroblast -->` makes that section's source chip open the matching tab. Use `#neuroblast`, `#code-havoc`, `#online-games` or `#personal-projects`, or an `https://` URL.
- Files whose names start with `_` are skipped, so you can keep drafts there.
- Anything in `knowledge/` may be repeated to any visitor. To make the chat decline a topic, write the rule down (for example: "Salary: not discussed here; email Stefan").
- `knowledge/` is never served as a web page (see `.assetsignore`).

Above about 50,000 tokens, sending everything on every request gets expensive, and it becomes worth switching to retrieval: embed sections with Workers AI, store them in Vectorize, and send only the closest matches. Only `buildMessages` in `src/chat.ts` would need to change.

## Working on it locally

```bash
npm install
```

Run the site with a fake AI that costs nothing:

```bash
npm run dev:mock
```

Then open http://localhost:8787. Messages containing `mock:error`, `mock:refusal`, `mock:slow` or `mock:long` try the other cases.

To use the real API locally (this spends money), put `ANTHROPIC_API_KEY=...` in a `.dev.vars` file (git-ignored), then run:

```bash
npm run dev
```

Type-check:

```bash
npm run check
```
