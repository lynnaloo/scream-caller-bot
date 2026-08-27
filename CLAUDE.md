# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A creepy Halloween chat bot that talks like the Ghostface caller from *Scream*. This is
**v2**: a small-LLM rewrite of the original Azure Bot Service + QnA Maker bot. The old
implementation was removed from the working tree (it lives in git history); the knowledge
bases and character art were kept on purpose.

## Architecture

```
public/ (static chat UI)  ──POST /api/chat──►  server.js (Express)  ──►  Anthropic API
                          ◄──Server-Sent Events── (holds the key,        (Claude Haiku,
                                                    streams the reply)     Ghostface persona)
```

- **`server.js`**: Node/Express (ESM). Serves `public/` and exposes `POST /api/chat`,
  which streams the model's reply back as SSE. Holds the API key server-side.
- **`public/index.html`, `public/style.css`, `public/app.js`**: the frontend. Vanilla
  HTML/CSS/JS, **no build step**. `app.js` keeps the full conversation in memory and sends
  it with each request (the server is stateless).
- **`public/caller.png`**: the Ghostface mask used as favicon, header mark, and avatar.

## The persona lives in one place

The entire personality is the `SYSTEM_PROMPT` string in `server.js`. To change how
Ghostface behaves, edit that. There is no knowledge base or training step. Its voice
(the trivia game, "I wanna play a game," "Name the killer in HALLOWEEN," "same category,"
"wrong answer") is derived from the original `scream-knowledge-base.tsv`.

**Keep the safety rails in the prompt.** This is a public, possibly all-ages Halloween toy:
threats stay theatrical/fictional, nothing sexual, no real-world harm instructions, no
targeting real named people or using a user's real personal data, and the bot must drop
the act and respond plainly if someone seems genuinely distressed. Preserve these when
editing the prompt.

## Model

- Default model is `claude-haiku-4-5` (small, cheap; overridable via `SCREAM_MODEL`).
  This is a deliberate choice for a fun, high-traffic Halloween bot, so do **not** silently
  upgrade it to a larger/pricier model.
- The integration uses the official `@anthropic-ai/sdk` with `client.messages.stream(...)`.
  When touching Claude/Anthropic API code, consult the `claude-api` skill for current
  model IDs and SDK usage rather than relying on memory.

## Run / develop

```bash
npm install
cp .env.example .env   # then add ANTHROPIC_API_KEY
npm start              # http://localhost:3000  (npm run dev = auto-restart)
```

`GET /api/health` reports `{ ok, model, keySet }`, handy for checking the key is loaded.

## Conventions & guardrails

- ESM throughout (`"type": "module"`). Use `import`, not `require`.
- No frontend framework or bundler; keep `public/` dependency-free and directly servable.
- Never commit `.env` or hardcode the API key; it must stay server-side only.
- **Leave the `*.tsv` knowledge bases and the `*.png` art in place.** They're kept
  intentionally as the source of the persona and as a keepsake of v1.
- Keep replies short and costs low: `server.js` caps `max_tokens`, trims history
  (`MAX_HISTORY`), and limits input length (`MAX_MESSAGE_CHARS`). Preserve these limits.

## Roadmap

- **Voice/phone:** the backend is shaped for it. Add a telephony layer (e.g. Twilio):
  speech-to-text, then `/api/chat`, then text-to-speech.
