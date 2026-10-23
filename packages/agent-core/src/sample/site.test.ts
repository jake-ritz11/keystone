import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePath } from "../workspace.ts";
import { runRead } from "../tools.ts";
import { SAMPLE_SITE, SAMPLE_TASKS } from "./site.ts";

test("every sample path is already normalized", () => {
  for (const path of Object.keys(SAMPLE_SITE)) assert.equal(normalizePath(path), path);
});

test("the planted problems are there for the tasks to find", () => {
  const find = (query: string) => (runRead(SAMPLE_SITE, "search", { query }) as { output: string }).output;
  assert.match(find("abuot.html"), /index\.html:\d+/, "broken link");
  assert.match(find("min-width: 720px"), /styles\.css:\d+/, "pricing overflow");
  assert.match(find('class="hero-image"'), /index\.html/, "image without alt");
  assert.doesNotMatch(find("prefers-color-scheme"), /styles\.css/, "no dark mode yet");
});

test("tasks have unique ids and a rubric", () => {
  assert.equal(new Set(SAMPLE_TASKS.map((t) => t.id)).size, SAMPLE_TASKS.length);
  for (const task of SAMPLE_TASKS) assert.ok(task.rubric.length > 0, task.id);
});
