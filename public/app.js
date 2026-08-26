const log = document.getElementById("log");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const resetBtn = document.getElementById("reset");

const OPENING_LINE = "Hello… Do you like scary movies?";

const GHOST_AVATAR = `<img src="/caller.png" alt="Ghostface" />`;

/** Full conversation history sent to the server each turn. */
let history = [];
let busy = false;

/** Render a completed message bubble. Returns the bubble element. */
function addBubble(role, text) {
  const who = role === "assistant" ? "caller" : "you";
  const row = document.createElement("div");
  row.className = `row ${who}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerHTML = who === "caller" ? GHOST_AVATAR : "🙂";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  row.append(avatar, bubble);
  log.append(row);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

function start() {
  log.innerHTML = "";
  history = [{ role: "assistant", content: OPENING_LINE }];
  addBubble("assistant", OPENING_LINE);
  input.focus();
}

async function send(text) {
  if (busy) return;
  busy = true;
  sendBtn.disabled = true;

  history.push({ role: "user", content: text });
  addBubble("user", text);

  // Placeholder caller bubble that fills in as the stream arrives.
  const bubble = addBubble("assistant", "");
  bubble.classList.add("caret");
  let reply = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });

    if (!res.ok || !res.body) {
      const info = await res.json().catch(() => ({}));
      throw new Error(info.error || "The call failed.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";

      for (const frame of frames) {
        const isError = frame.includes("event: error");
        const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const payload = JSON.parse(dataLine.slice(5).trim() || "{}");

        if (isError) {
          throw new Error(payload.message || "Something went wrong.");
        }
        if (typeof payload.delta === "string") {
          reply += payload.delta;
          bubble.textContent = reply;
          log.scrollTop = log.scrollHeight;
        }
      }
    }

    if (!reply.trim()) reply = "…";
    bubble.textContent = reply;
    history.push({ role: "assistant", content: reply });
  } catch (err) {
    bubble.textContent = err.message || "Static on the line…";
    bubble.style.color = "var(--blood-bright)";
    // Roll back the just-added user turn so they can retry cleanly.
    if (history.length && history[history.length - 1].role === "user") {
      history.pop();
    }
  } finally {
    bubble.classList.remove("caret");
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  send(text);
});

resetBtn.addEventListener("click", start);

start();
