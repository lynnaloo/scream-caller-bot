# Scream Caller Bot &nbsp; :jack_o_lantern: :ghost: :scream:

Do you like scary movies?

A creepy little Halloween bot that answers like the Ghostface caller from *Scream*.
**v2** ditches the old Azure + QnA Maker setup ([that story here](https://dev.to/lynnaloo/how-i-accidentally-created-a-creepy-halloween-bot-and-you-can-too-1ed7))
and lets a small, cheap LLM (Claude Haiku) *become* Ghostface — so now he improvises the
taunts instead of reading from a script. v1 rests quietly in the git history where it belongs.

## Answer the phone

```bash
npm install
cp .env.example .env    # then drop in your ANTHROPIC_API_KEY
npm start               # http://localhost:3000
```

Pick up. Play his game. Try not to say "who's there?" 🔪

## The gory details

- **`server.js`** — tiny Express backend. Holds your API key, streams his replies, *is* the persona (edit the `SYSTEM_PROMPT` to mess with him).
- **`public/`** — the whole chat UI. No framework, no build step, no mercy.
- **`*.tsv` + `*.png`** — the original v1 knowledge bases and mask art, kept around as the source of his voice (and for old times' sake).

## Going public

He needs a backend to keep that API key secret, so he can't live on GitHub Pages. Any Node
host works (Render, Railway, Fly) — set `ANTHROPIC_API_KEY`, set a spend limit, and maybe
sleep with the lights on.

*It's a Halloween toy. He's a movie character. It's all just for fun.* 🎃
