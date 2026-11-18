---
title: The portfolio's AI chat – how it works
---

# The AI chat on this portfolio

The "Ask AI about my work" chat on the portfolio answers visitors' questions about Stefan's work. This file describes how it is built. The source code is in the portfolio's GitHub repository: https://github.com/StefanDokman/Porfolio

## Overview of the AI chat

- The answers come from Claude Haiku 5.5 through the Anthropic API, using Anthropic's official TypeScript SDK.
- The chat only answers from a set of Markdown notes about Stefan's work (the knowledge base). Each answer cites the notes it used, shown as "Sources" links that open the matching tab of the portfolio.
- The backend is a Cloudflare Worker written in TypeScript. The same Worker serves the portfolio's static files, so the chat runs on the same domain with no separate server.
- Which part does what: Workers Static Assets serves the site's files directly, and requests to /api/ run the Worker code. POST /api/chat answers a question, and GET /api/chat/status tells the page whether the chat is switched on. A SQLite-backed Durable Object enforces the budget and the per-visitor limits. Deploys run through Cloudflare Workers Builds on every push to the main branch.
- The chat window is plain JavaScript and CSS with no framework, styled to match the site.

## Retrieval approach: whole knowledge base instead of vector search

- The knowledge base is a folder of Markdown files (knowledge/) in the repository. The folder is excluded from the published site, so the notes are never served as web pages.
- Before every deploy (and every local dev run), Wrangler runs a Node build script that reads each Markdown file, splits it at its "##" headings and writes the sections into a generated TypeScript module. Wrangler bundles that module into the Worker, so the notes ship inside the Worker's code and are never fetched from storage at runtime.
- Each section becomes one document the model can cite. A short comment under a heading can name the portfolio tab the section belongs to, which becomes the link on its "Sources" chip. Files whose names start with an underscore are drafts and are skipped.
- Every request sends all of these sections to the model as document blocks with citations turned on. Because the knowledge base is small (a few thousand tokens), sending all of it is more reliable than vector search: there are no retrieval misses where the right section isn't found.
- Prompt caching keeps this cheap. The system prompt and the documents always come first and never change between visitors, so they form one cached prefix. Follow-up questions within five minutes read it from the cache at a small fraction of the normal price.
- If the knowledge base grows past roughly 50,000 tokens, the plan is to switch to classic retrieval: embed each section with Workers AI, store the vectors in Cloudflare Vectorize, and send only the closest matches. Only one function would change.

## Streaming and sources

- Answers stream word by word. The Worker reads the Anthropic SDK's stream and passes a small server-sent-events stream to the browser: text pieces as they arrive, then a final event with the cited sources, or an error code.
- Citations arrive as part of the model's stream, each naming the document it quotes. The Worker maps those to the knowledge sections and sends their names and portfolio links to the browser.
- The browser reads the stream with fetch and a stream reader. The Stop button cancels the request, and the Worker then aborts the call to the model, so a stopped answer stops costing money.

## How visitors are recognised

- There are no accounts, logins or cookies.
- For rate limiting, a visitor is identified by the IP address Cloudflare passes to the Worker in the CF-Connecting-IP header. The Worker hashes it with SHA-256 together with the current UTC date and keeps the first 12 bytes of the hash as the visitor's key.
- Only that key is stored, never the raw IP address. Because the date is part of the hash, the same visitor gets a different key every day, and the previous day's counts are deleted.

## Limits and how they are enforced

The chat has four usage limits, all checked by one global Durable Object before the model is called:
- $5 of estimated spend per UTC month.
- $0.16 of estimated spend per UTC day. That is one 31st of the monthly budget, so heavy use can only pause the chat until the next day, never for the rest of the month.
- 6 messages per minute per visitor, counted over a sliding 60-second window kept in the Durable Object's memory.
- 40 messages per UTC day per visitor, counted in the Durable Object's SQLite storage.

Each chat request goes through these checks in order:
- Only POST is accepted, and the request's Origin header must be the portfolio's own address. Other requests get a 405 or 403.
- The chat must be switched on and the API key configured, otherwise the reply is a 503.
- The conversation is validated: at most 64,000 characters and 50 messages, roles must alternate and end with the visitor's message, visitor messages are limited to 1,000 characters and earlier answers to 6,000. A bad request gets a 400 or 413.
- The Worker asks the Durable Object to admit the message. It checks the monthly and daily spend first, then the visitor's per-minute and per-day counts, and only counts the message if every check passes. Otherwise the reply is a 429, and the chat window shows a friendly message.
- Only the last 12 turns are sent to the model, and each answer is capped at 2,048 output tokens, with one retry and a 60-second timeout on the API call.

How spending is tracked:
- After each answer, the Worker estimates its cost from the token usage the API reports: normal input, prompt-cache writes (1.25 times the input price), cache reads and output, using a price table per model. An unknown model is priced on the high side.
- The cost is added to the day's and the month's totals in the Durable Object's SQLite storage. An answer that was stopped or cut off has no final usage, so it is charged as if it had used its full output cap; a failed call that used no tokens costs nothing.
- One Durable Object instance handles every check, one at a time, so two requests can't slip past a limit together. Costs are recorded after each answer, so answers already in progress can take the total slightly past a limit.
- The Anthropic API key belongs to its own workspace with a $5 monthly spend limit, a hard backstop behind the Worker's own estimate.
- The model, both budgets, both per-visitor limits and an on/off switch are Worker settings, changed without touching the code. The chat button only appears when the key is configured and the chat is switched on.

## Privacy

- Conversations aren't stored on the server. The conversation lives only in the visitor's browser tab (session storage) and is gone when the tab is closed.
- The server logs only the model, token counts and estimated cost of each answer, never the questions or the answers.

## Prompt and behaviour rules

- The system prompt tells the model to answer only from the notes, to say so when the notes don't cover something and suggest emailing Stefan, and never to guess facts.
- Code Havoc games were released under the clients' own names and brands, so the model must not name or guess the real titles or the clients.
- The model talks about Stefan in the third person, keeps answers short, writes plain text, replies in the visitor's language and politely declines unrelated requests.
- The model runs at low effort, since answering from a small set of notes doesn't need deep reasoning; this keeps answers fast and cheap.

## Chat window details

- The chat's script and styles load only after the server confirms the chat is enabled, so the rest of the page is unaffected.
- Answers are inserted as plain text, never as HTML, so model output can't inject markup; links and email addresses in answers are made clickable safely.
- It works with the keyboard (Enter sends, Shift+Enter adds a line, Escape closes), announces finished answers to screen readers, and opens full-screen on phones.

## Development setup

- A mock of the Anthropic API, included in the repository, streams answers in the same format as the real API. With it the whole chat runs locally without an API key and without spending anything, including error, refusal, slow and cut-off answers.
- Before deploying, a Wrangler dry run checks that only the site's own files are uploaded as static assets, never source code, the knowledge files or dependencies.
