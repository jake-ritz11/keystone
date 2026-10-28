import { test } from "node:test";
import assert from "node:assert/strict";
import { nextChunk, speakable } from "./chunk.ts";

/** Feeds `text` in pieces of `size` characters and collects what would be announced. */
function stream(text: string, size: number) {
  const said: string[] = [];
  let from = 0;
  for (let i = size; i < text.length + size; i += size) {
    const chunk = nextChunk(text.slice(0, i), from);
    if (chunk) {
      if (chunk.text) said.push(chunk.text);
      from = chunk.end;
    }
  }
  const rest = nextChunk(text, from, { flush: true });
  if (rest?.text) said.push(rest.text);
  return said;
}

test("nothing is said until a sentence ends", () => {
  assert.equal(nextChunk("I read the", 0), null);
  assert.deepEqual(nextChunk("I read the file. Then", 0), { text: "I read the file.", end: 16 });
});

test("a burst that finishes several sentences is one announcement", () => {
  assert.deepEqual(nextChunk("One. Two! Three? Fo", 0), { text: "One. Two! Three?", end: 16 });
});

test("token size changes how sentences are grouped, never the words said", () => {
  const text = "I found the bug in `utils.ts`. The loop starts at 1, not 0. I fixed it, e.g. by changing the bound. Done";
  const sentences = ["I found the bug in utils.ts.", "The loop starts at 1, not 0.", "I fixed it, e.g. by changing the bound.", "Done"];
  assert.deepEqual(stream(text, 1), sentences);
  for (const size of [3, 7, 40, 200]) assert.equal(stream(text, size).join(" "), sentences.join(" "), `size ${size}`);
  // Arriving in one piece, it is said in two: the finished sentences, then the rest at the end.
  assert.equal(stream(text, 200).length, 2);
});

test("full stops in code, numbers and abbreviations don't end a sentence", () => {
  assert.equal(nextChunk("Open `app.config. ts` next", 0), null);
  assert.equal(nextChunk("Version 3.5 is out", 0), null);
  assert.equal(nextChunk("Use a token, i.e. a variable", 0), null);
  assert.equal(nextChunk("Compare it vs. the old one", 0), null);
});

test("a colon before a list or a tool call, and a line break, end a chunk", () => {
  assert.deepEqual(nextChunk("I'll change two files:\n- a", 0)?.text, "I'll change two files:");
  assert.deepEqual(nextChunk("- first item\n- sec", 0)?.text, "first item");
});

test("a closing quote or bracket stays with its sentence", () => {
  assert.deepEqual(nextChunk('It says "done." Next', 0)?.text, 'It says "done."');
  assert.deepEqual(nextChunk("It works (I checked.) Next", 0)?.text, "It works (I checked.)");
});

test("a long run without punctuation is cut at a space", () => {
  const words = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
  const chunk = nextChunk(words, 0, { max: 100 });
  assert.ok(chunk);
  assert.ok(chunk.end <= 101);
  assert.ok(chunk.text.endsWith(String(chunk.text.split(" ").at(-1))));
  assert.equal(words[chunk.end - 1], " ");
});

test("flush returns everything left, and nothing when it's all been said", () => {
  assert.deepEqual(nextChunk("Done. And one more", 6, { flush: true }), { text: "And one more", end: 18 });
  assert.equal(nextChunk("Done.", 5, { flush: true }), null);
});

test("formatting marks are not read out", () => {
  assert.equal(speakable("## Plan\n- **Read** `a.ts`\n- Fix   it"), "Plan Read a.ts Fix it");
});
