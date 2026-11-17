---
title: The portfolio's AI chat – how it works
---

# The AI chat on this portfolio

The "Ask AI about my work" chat on the portfolio answers visitors' questions about Stefan's work. This file describes how it is built. The source code is in the portfolio's GitHub repository: https://github.com/StefanDokman/Porfolio

## Overview of the AI chat

- The answers come from Claude Haiku 5.5 through the Anthropic API, using Anthropic's official TypeScript SDK.
- The chat only answers from a set of Markdown notes about Stefan's work (the knowledge base). Each answer cites the notes it used, shown as "Sources" links that open the matching tab of the portfolio.
- The backend is a Cloudflare Worker written in TypeScript. The same Worker serves the portfolio's static files, so the chat runs on the same domain with no separate server.
- The chat window is plain JavaScript and CSS with no framework, styled to match the site.

## Retrieval approach: whole knowledge base instead of vector search

- The knowledge base is a folder of Markdown files. A build script runs before every deploy and splits each file at its "##" headings. Each section becomes one document the model can cite, and a section can name the portfolio tab it belongs to.
- Every request sends all of these sections to the model as document blocks with citations turned on. Because the knowledge base is small (a few thousand tokens), sending all of it is more reliable than vector search: there are no retrieval misses where the right section isn't found.
- Prompt caching keeps this cheap. The system prompt and the documents always come first and never change between visitors, so they form one cached prefix. Follow-up questions within five minutes read it from the cache at a small fraction of the normal price.
- If the knowledge base grows past roughly 50,000 tokens, the plan is to switch to classic retrieval: embed each section with Workers AI, store the vectors in Cloudflare Vectorize, and send only the closest matches. Only one function would change.

## Streaming and sources

- Answers stream word by word. The Worker reads the Anthropic SDK's stream and passes a small server-sent-events stream to the browser: text pieces as they arrive, then a final event with the cited sources, or an error code.
- Citations arrive as part of the model's stream, each naming the document it quotes. The Worker maps those to the knowledge sections and sends their names and portfolio links to the browser.
- The browser reads the stream with fetch and a stream reader. The Stop button cancels the request, and the Worker then aborts the call to the model, so a stopped answer stops costing money.

## Cost and abuse protection

- The chat runs on a budget of $5 per month. A Cloudflare Durable Object (with SQLite storage) acts as a single global guard that every message passes through.
- The guard estimates each answer's cost from its token usage, including cache writes and cache reads, and keeps totals per UTC day and month. The chat pauses when the daily ($0.16) or monthly ($5) estimate is reached. Because the daily limit is one 31st of the monthly one, heavy use can only switch the chat off until the next day, never for the rest of the month.
- Each visitor can send 6 messages a minute and 40 a day. Visitors are told apart by a SHA-256 hash of their IP address salted with the current date, so raw IP addresses are never stored and the hashes change daily.
- Requests are only accepted from the portfolio page itself (an Origin check). Messages are validated and limited to 1,000 characters, only the last 12 turns of a conversation are sent, and every answer has a hard token cap.
- The Anthropic API key belongs to its own workspace with a $5 monthly spend limit, as a hard backstop behind the Worker's own estimate. The chat button only appears when the key is configured, and a setting switches the whole chat off.

## Privacy

- Conversations aren't stored on the server. The conversation lives only in the visitor's browser tab (session storage) and is gone when the tab is closed.
- The server logs only the model, token counts and estimated cost of each answer, never the questions or the answers.

## Prompt and behaviour rules

- The system prompt tells the model to answer only from the notes, to say so when the notes don't cover something and suggest emailing Stefan, and never to guess facts.
- Code Havoc titles and clients are under NDA, so the model must not name or guess them.
- The model talks about Stefan in the third person, keeps answers short, writes plain text, replies in the visitor's language and politely declines unrelated requests.
- The model runs at low effort, since answering from a small set of notes doesn't need deep reasoning; this keeps answers fast and cheap.

## Chat window details

- The chat's script and styles load only after the server confirms the chat is enabled, so the rest of the page is unaffected.
- Answers are inserted as plain text, never as HTML, so model output can't inject markup; links and email addresses in answers are made clickable safely.
- It works with the keyboard (Enter sends, Shift+Enter adds a line, Escape closes), announces finished answers to screen readers, and opens full-screen on phones.

## Development setup

- A mock of the Anthropic API, included in the repository, streams answers in the same format as the real API. With it the whole chat runs locally without an API key and without spending anything, including error, refusal, slow and cut-off answers.
- Before deploying, a Wrangler dry run checks that only the site's own files are uploaded as static assets, never source code, the knowledge files or dependencies.
