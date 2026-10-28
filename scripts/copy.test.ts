/**
 * The mechanical rules from docs/content-guidelines.md, checked against the strings people see:
 * double-quoted and template strings, and JSX text, in the agent app, the agent core, the
 * component library and the docs examples. Comments are skipped; the system prompt is the
 * model's, not the interface's, so it's skipped too. Everything else in the guidelines is a
 * judgment call for review.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const DIRS = ["apps/agent/app", "packages/agent-core/src", "packages/ui/src", "apps/docs/app/_examples"];
const SKIP = [/\.test\.tsx?$/, /agent-core\/src\/prompt\.ts$/];

const RULES: [name: string, pattern: RegExp][] = [
  ["an exclamation mark ends a sentence", /[A-Za-z)]!(?=\s|$)/],
  ['three dots instead of "…"', /\.\.\.(?!\w)/],
  ["a banned word", /\b(?:oops|please|simply|click here)\b/i],
  ['"Something went wrong"', /something went wrong/i],
];

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    const rel = relative(root, path).replace(/\\/g, "/");
    return /\.tsx?$/.test(entry.name) && !SKIP.some((s) => s.test(rel)) ? [path] : [];
  });
}

/** The user-visible strings in a source file, roughly: enough for rules that can't misfire on code. */
export function strings(source: string): string[] {
  // Block comments (including JSX's {/* */}), then line comments that start a line or follow
  // whitespace, so "https://" in a string survives.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
  const quoted = [...code.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)].map((m) => m[1]!);
  const templates = [...code.matchAll(/`([^`]*)`/g)].map((m) => m[1]!.replace(/\$\{[^}]*\}/g, "x"));
  const jsxText = [...code.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)].map((m) => m[1]!.trim());
  // Copy has a space in it; identifiers, class names and paths mostly don't.
  return [...quoted, ...templates, ...jsxText].filter((s) => /[A-Za-z]/.test(s) && /\s/.test(s));
}

test("the extractor finds copy and skips comments and code", () => {
  const found = strings(`
    // A comment! It says please.
    const label = "Approve plan";
    /* Oops, a block comment... */
    const href = "https://example.com";
    return <p className="note">Waiting for you</p>;
  `);
  assert.deepEqual(found, ["Approve plan", "Waiting for you"]);
});

for (const dir of DIRS) {
  test(`${dir}: copy follows the mechanical content rules`, () => {
    const problems: string[] = [];
    for (const file of files(join(root, dir))) {
      for (const text of strings(readFileSync(file, "utf8"))) {
        for (const [name, pattern] of RULES) {
          if (pattern.test(text)) problems.push(`${relative(root, file)}: ${name}: "${text}"`);
        }
      }
    }
    assert.deepEqual(problems, []);
  });
}
