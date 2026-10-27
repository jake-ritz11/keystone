import { test } from "node:test";
import assert from "node:assert/strict";
import { auditSource } from "./audit.ts";

const rules = (file: string, text: string) => auditSource(file, text).map((f) => f.rule);

test("flags a hex color but not a token reference", () => {
  assert.deepEqual(rules("a.css", ".x { color: #ff0000; }"), ["hard-coded-color"]);
  assert.deepEqual(rules("a.css", ".x { color: var(--ks-color-text); }"), []);
  // Palette steps bypass themes and high contrast, so they count as literals.
  assert.deepEqual(rules("a.css", ".x { color: var(--ks-palette-blue-600); }"), ["hard-coded-color"]);
});

test("flags raw px spacing but not tokens or zero", () => {
  assert.deepEqual(rules("a.css", ".x {\n  padding: 12px;\n}"), ["off-scale-spacing"]);
  assert.deepEqual(rules("a.css", ".x { margin-top: 6px; }"), ["off-scale-spacing"]);
  assert.deepEqual(rules("a.css", ".x {\n  padding: var(--ks-space-3);\n  margin: 0;\n}"), []);
});

test("cursor: pointer needs :focus-visible", () => {
  assert.deepEqual(rules("a.css", ".x { cursor: pointer; }"), ["missing-focus-visible"]);
  assert.deepEqual(rules("a.css", ".x { cursor: pointer; }\n.x:focus-visible { outline: 0; }"), []);
});

test("motion needs a reduced-motion fallback", () => {
  assert.deepEqual(rules("a.css", ".x { transition: opacity 1s; }"), ["missing-reduced-motion"]);
});

test("a clickable div needs a role", () => {
  assert.deepEqual(rules("a.tsx", "<div onClick={go}>Go</div>"), ["clickable-non-button"]);
  assert.deepEqual(rules("a.tsx", '<div role="button" onClick={go}>Go</div>'), []);
});
