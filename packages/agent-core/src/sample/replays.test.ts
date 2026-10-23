import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession, DEFAULT_VARIANT, reduce, type Action, type SessionState } from "../session.ts";
import { replayTransport, ReplayFinished, streamTurn } from "../transport.ts";
import { systemPrompt } from "../prompt.ts";
import { REPLAYS } from "./replays.ts";
import { SAMPLE_SITE, SAMPLE_TASKS } from "./site.ts";

/** Runs a replay to the end through the real driver, approving every edit. */
async function play(task: string, approval: "each" | "end" | "auto" = "each"): Promise<SessionState> {
  const script = REPLAYS[task];
  assert.ok(script, task);
  const transport = replayTransport(script, { chunkDelay: 0, firstDelay: 0 });
  const prompt = SAMPLE_TASKS.find((t) => t.id === task)!.prompt;
  let state = reduce(createSession(SAMPLE_SITE, { planning: "act", approval, visibility: "timeline" }), { type: "user_message", text: prompt });
  const dispatch = (action: Action) => {
    state = reduce(state, action);
  };
  for (let guard = 0; guard < 20; guard++) {
    if (state.status === "waiting") {
      for (const item of state.items) if (item.type === "tool" && item.status === "awaiting") dispatch({ type: "approve", id: item.id });
      continue;
    }
    if (state.status !== "ready") break;
    await streamTurn(transport, { system: systemPrompt(state.variant), messages: state.messages, variant: state.variant }, dispatch, new AbortController().signal);
  }
  return state;
}

test("scripts are shaped like real turns: tools stop with tool_use, the last turn has none", () => {
  for (const [task, turns] of Object.entries(REPLAYS)) {
    turns.forEach((turn, i) => {
      const hasTool = turn.blocks.some((b) => "tool" in b);
      assert.equal(turn.stop, hasTool ? "tool_use" : "end_turn", `${task} turn ${i + 1}`);
    });
    assert.equal(turns.at(-1)?.stop, "end_turn", task);
  }
});

for (const task of Object.keys(REPLAYS)) {
  test(`replay "${task}" runs clean: no failed tools, ends done`, async () => {
    const state = await play(task);
    const failed = state.items.filter((i) => i.type === "tool" && i.status === "failed");
    assert.deepEqual(failed.map((f) => f.type === "tool" && f.error), []);
    assert.equal(state.status, "done");
    assert.ok(state.plan?.every((s) => s.status === "done"), "plan finishes complete");
  });
}

test("broken-link replay fixes only the typo", async () => {
  const state = await play("broken-link");
  assert.doesNotMatch(state.workspace["index.html"] ?? "", /abuot/);
  assert.equal(state.workspace["about.html"], SAMPLE_SITE["about.html"]);
  assert.equal(state.workspace["styles.css"], SAMPLE_SITE["styles.css"]);
});

test("pricing replay removes the 720px floor and wraps the table", async () => {
  const state = await play("pricing-mobile", "auto");
  assert.doesNotMatch(state.workspace["styles.css"] ?? "", /min-width: 720px/);
  assert.match(state.workspace["index.html"] ?? "", /<div class="plans-scroll"[^>]*>\n\s*<table class="plans">/);
  assert.match(state.workspace["index.html"] ?? "", /<\/table>\n\s*<\/div>/);
});

test("a finished replay says so instead of hanging", async () => {
  const transport = replayTransport([], { chunkDelay: 0, firstDelay: 0 });
  await assert.rejects(async () => {
    for await (const _ of transport({ system: "", messages: [], variant: DEFAULT_VARIANT }, new AbortController().signal)) void _;
  }, ReplayFinished);
});

test("aborting a replay stops it mid-stream", async () => {
  const transport = replayTransport(REPLAYS["pricing-mobile"]!, { chunkDelay: 5, firstDelay: 0 });
  const controller = new AbortController();
  let events = 0;
  await assert.rejects(async () => {
    for await (const _ of transport({ system: "", messages: [], variant: DEFAULT_VARIANT }, controller.signal)) {
      if (++events === 3) controller.abort(new Error("stopped"));
    }
  });
  assert.equal(events, 3);
});

test("dark-mode replay moves every color into variables with dark values", async () => {
  const state = await play("dark-mode", "auto");
  const css = state.workspace["styles.css"] ?? "";
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  // Outside the two variable blocks, no literal colors remain.
  const rules = css.replace(/:root \{[^}]*\}/g, "").replace(/@media \(prefers-color-scheme: dark\) \{[^}]*\}\s*\}/g, "");
  assert.doesNotMatch(rules, /#[0-9a-f]{3,8}\b/i);
});

test("accessibility replay meets its rubric and leaves the broken link alone", async () => {
  const state = await play("accessibility", "auto");
  const html = state.workspace["index.html"] ?? "";
  assert.match(html, /class="hero-image" alt="[^"]+"/);
  assert.doesNotMatch(html, /<th><\/th>/);
  assert.equal((html.match(/<th scope="row">/g) ?? []).length, 4);
  assert.doesNotMatch(state.workspace["styles.css"] ?? "", /#b0b0b0|#aaaaaa/);
  assert.match(html, /abuot\.html/, "a separate task: not touched");
});
