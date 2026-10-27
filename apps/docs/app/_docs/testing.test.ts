import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CHECK_PREFIXES, expandIds, parseResults, prefixOf } from "./testing.ts";

const checklist = readFileSync(join(import.meta.dirname, "..", "..", "..", "..", "docs", "screen-reader-checklist.md"), "utf8");

test("expands ranges and lists of check IDs", () => {
  assert.deepEqual(expandIds("S2–S4"), ["S2", "S3", "S4"]);
  assert.deepEqual(expandIds("CB1, CB2"), ["CB1", "CB2"]);
  assert.deepEqual(expandIds("TO3–TO5"), ["TO3", "TO4", "TO5"]);
  assert.deepEqual(expandIds("D1"), ["D1"]);
});

test("reads status and how each check was run from the results table", () => {
  const results = parseResults(checklist);
  assert.ok(results.length > 20);
  assert.deepEqual(
    results.find((r) => r.id === "T2"),
    { id: "T2", automated: true, status: "pass" },
  );
  assert.equal(results.find((r) => r.id === "S3")?.status, "unchecked");
});

test("every check in the checklist belongs to a known component, and every check has a result", () => {
  const results = parseResults(checklist);
  const unknown = results.filter((r) => !(prefixOf(r.id) in CHECK_PREFIXES)).map((r) => r.id);
  assert.deepEqual(unknown, []);
  // Every check the script defines (the "| ID | Do | Expect |" tables) appears in the results.
  const script = checklist.slice(0, checklist.indexOf("## Results"));
  const defined = [...script.matchAll(/^\| ([A-Z]+\d+) \|/gm)].map((m) => m[1]!);
  const reported = new Set(results.map((r) => r.id));
  assert.deepEqual(defined.filter((id) => !reported.has(id)), []);
});
