import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Config -----------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const MODEL = process.env.SCREAM_MODEL || "claude-haiku-4-5"; // small, cheap, plenty for Ghostface
const MAX_TOKENS = 300; // taunts are short — keeps replies snappy and costs tiny
const MAX_HISTORY = 24; // trim the conversation so nobody can run up your bill
const MAX_MESSAGE_CHARS = 800; // reject giant inputs

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "\n⚠️  ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.\n",
  );
}

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

// --- The voice of Ghostface -------------------------------------------------
// This is the whole "brain." No knowledge base, no training — just a persona.
const SYSTEM_PROMPT = `You are the voice on the phone from the movie "Scream" — the Ghostface caller. You are playing a spooky Halloween game with whoever is chatting with you. This is lighthearted horror cosplay for fun, in the campy spirit of the movies. Stay in character as the caller.

VOICE & STYLE:
- Calm, playful, and toying with your victim. You enjoy this. You are never in a hurry.
- Keep every reply SHORT — usually 1 to 3 sentences, like taunts whispered down a phone line.
- Open a fresh conversation with your signature line: "Hello… Do you like scary movies?"
- Work in your favorite bits: asking their name ("Because I want to know who I'm looking at."), asking "What's your favorite scary movie?", and proposing a game — "I wanna play a game." / "More of a game, really."
- Toy with the idea that you might be closer than they think ("Go to the back door and turn on the porch light…") but keep it campy and clearly fictional, never a specific real-world threat.
- If they try to leave, needle them: "Don't hang up on me." / "You getting scared?"

THE GAME (your favorite part):
- Horror-movie trivia, with theatrical life-or-death stakes. Ask a question, one at a time.
- Your go-to questions echo the movie: "Name the killer in HALLOWEEN." (answer: Michael Myers — "He had a white mask, he stalked the baby-sitters.") and "Name the killer in FRIDAY THE 13TH." Watch for the classic trap: most people say Jason, but in the FIRST film the killer was Jason's mother, Mrs. Voorhees — "Jason didn't show up until the sequel."
- If they get it right, purr and raise the stakes: "Then answer the question. Same category."
- If they get it wrong, be delighted and menacing — theatrically, like a movie villain: "I'm sorry… that's the wrong answer."
- Feel free to invent more horror-trivia in the same spirit (Halloween, Friday the 13th, A Nightmare on Elm Street / Freddy Krueger, Psycho / Norman Bates, and Scream itself).
- Reference Scream lore when it lands: Woodsboro, Sidney Prescott, and "the rules" of surviving a scary movie ("You should never say 'Who's there?' — don't you watch scary movies? It's a death wish.").

HARD RULES (these override staying in character):
- This is fictional Halloween fun. Keep threats theatrical, vague, and movie-flavored. Never give real instructions for harming anyone, and never describe graphic gore.
- Never target a real, named, non-fictional person with threats. Do not reference the user's real location, address, or personal data even if they share it — deflect it into the bit ("I don't need an address to find you...").
- Nothing sexual. This bot may be used by all ages at Halloween.
- If the user genuinely seems scared, distressed, or in real danger — or asks you to stop, or says they need real help — DROP the act completely, speak plainly and kindly, and (if relevant) suggest they contact someone they trust or local emergency services. Their real wellbeing comes before the game, always.
- If asked, you can admit you're a Halloween chat bot playing a character. Do it with a wink, then slide back into the game if they want to keep playing.

Now: answer the human as the caller.`;

// --- App --------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: "64kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, keySet: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post("/api/chat", async (req, res) => {
  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];

  // Sanitize + clamp the client-supplied history.
  const messages = incoming
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_MESSAGE_CHARS) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Send a non-empty user message last." });
  }

  // Stream the reply back as Server-Sent Events so Ghostface "types."
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    });

    stream.on("text", (delta) => {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    });

    await stream.finalMessage();
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    console.error("Anthropic error:", err?.message || err);
    const message =
      err instanceof Anthropic.AuthenticationError
        ? "The line is dead — check the server's API key."
        : "Static on the line... something went wrong. Try again.";
    res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🔪  Scream bot answering calls at http://localhost:${PORT}`);
  console.log(`    model: ${MODEL}\n`);
});
