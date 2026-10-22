import { test } from "node:test";
import assert from "node:assert/strict";
import { GenerateError, generateComponent } from "./generate.ts";

test("an interactive component comes out clean against the audit", () => {
  const out = generateComponent({ name: "IconButton", element: "button", variants: ["plain", "outline"], sizes: ["sm", "md"] });
  assert.deepEqual(out.findings, []);
  assert.deepEqual(
    out.files.map((f) => f.path),
    ["packages/ui/src/icon-button/IconButton.tsx", "packages/ui/src/icon-button/IconButton.module.css"],
  );
  const [tsx = "", css = ""] = out.files.map((f) => f.contents);
  assert.match(tsx, /export type IconButtonVariant = "plain" \| "outline";/);
  assert.match(tsx, /variant = "plain", size = "md"/);
  assert.match(tsx, /<button ref=\{ref\} type="button"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(out.exports, /export type \{ IconButtonProps, IconButtonSize, IconButtonVariant \}/);
});

test("a static element gets no pointer, focus or motion rules", () => {
  const out = generateComponent({ name: "Badge", element: "span" });
  assert.deepEqual(out.findings, []);
  const css = out.files[1]?.contents ?? "";
  assert.doesNotMatch(css, /cursor|transition|focus-visible/);
  assert.match(out.files[0]?.contents ?? "", /export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> \{\}/);
});

test("bad names and ids are rejected with a reason", () => {
  assert.throws(() => generateComponent({ name: "badge", element: "span" }), GenerateError);
  assert.throws(() => generateComponent({ name: "Badge", element: "span", variants: ["sm"] }), /reserved/);
  assert.throws(() => generateComponent({ name: "Badge", element: "span", variants: ["has-dash"] }), /camelCase/);
  assert.throws(() => generateComponent({ name: "Badge", element: "span", variants: ["a", "a"] }), /unique/);
});
