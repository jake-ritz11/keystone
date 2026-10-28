import { test } from "node:test";
import assert from "node:assert/strict";
import { segments } from "./cite.ts";

const FILES = new Set(["index.html", "about.html", "styles.css", "docs/notes.md"]);

test("a bare file name that exists becomes a citation; one that doesn't stays text", () => {
  assert.deepEqual(segments("It pointed to abuot.html, a typo for about.html.", FILES), [
    { type: "text", text: "It pointed to abuot.html, a typo for " },
    { type: "cite", text: "about.html", cite: { path: "about.html" } },
    { type: "text", text: "." },
  ]);
});

test("a line or a range is kept, with a hyphen or an en dash", () => {
  assert.deepEqual(
    segments("See index.html:14 and styles.css:3-9 and styles.css:20–22.", FILES)
      .filter((s) => s.type === "cite")
      .map((s) => s.type === "cite" && s.cite),
    [
      { path: "index.html", line: 14 },
      { path: "styles.css", line: 3, end: 9 },
      { path: "styles.css", line: 20, end: 22 },
    ],
  );
});

test("a code span that is exactly a reference becomes the citation; other code stays code", () => {
  assert.deepEqual(segments("Fixed `index.html:14` and the `.plans` rule in `styles.css`.", FILES), [
    { type: "text", text: "Fixed " },
    { type: "cite", text: "index.html:14", cite: { path: "index.html", line: 14 } },
    { type: "text", text: " and the " },
    { type: "code", text: ".plans" },
    { type: "text", text: " rule in " },
    { type: "cite", text: "styles.css", cite: { path: "styles.css" } },
    { type: "text", text: "." },
  ]);
  assert.deepEqual(segments("Use `<a href=\"about.html\">`.", FILES), [
    { type: "text", text: "Use " },
    { type: "code", text: '<a href="about.html">' },
    { type: "text", text: "." },
  ]);
});

test("paths in folders work, and parts of longer tokens don't match", () => {
  const cites = (text: string) => segments(text, FILES).filter((s) => s.type === "cite").map((s) => s.text);
  assert.deepEqual(cites("Notes are in docs/notes.md:2."), ["docs/notes.md:2"]);
  assert.deepEqual(cites("Not old/index.html, not index.html.bak, not https://x.com/index.html"), []);
});
