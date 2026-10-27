import { test } from "node:test";
import assert from "node:assert/strict";
import { filterCommands } from "./filter.ts";

const items = [
  { label: "Open settings" },
  { label: "Toggle theme", keywords: ["dark", "light", "appearance"] },
  { label: "Settings sync" },
  { label: "New task" },
  { label: "Stop the agent", keywords: ["cancel", "halt"] },
];
const labels = (q: string) => filterCommands(items, q).map((i) => i.label);

test("an empty query keeps every command, in order", () => {
  assert.deepEqual(labels("  "), items.map((i) => i.label));
});

test("matching ignores case and finds keywords", () => {
  assert.deepEqual(labels("DARK"), ["Toggle theme"]);
  assert.deepEqual(labels("cancel"), ["Stop the agent"]);
});

test("labels that start with the query rank first, then word starts, then the rest", () => {
  assert.deepEqual(labels("set"), ["Settings sync", "Open settings"]);
  assert.deepEqual(labels("t"), ["Toggle theme", "New task", "Stop the agent", "Open settings", "Settings sync"]);
});

test("every word has to match, in any order", () => {
  assert.deepEqual(labels("sync settings"), ["Settings sync"]);
  assert.deepEqual(labels("settings nothing"), []);
});
