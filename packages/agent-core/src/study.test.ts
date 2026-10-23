import { test } from "node:test";
import assert from "node:assert/strict";
import type Anthropic from "@anthropic-ai/sdk";
import { createSession, reduce, type Action, type SessionState } from "./session.ts";
import { participantId, studyEvent, summarizeSession, type StudyEvent } from "./study.ts";
import type { Workspace } from "./workspace.ts";

const WS: Workspace = { "index.html": '<a href="abuot.html">About</a>\n' };

/** Runs actions through the reducer, recording the study's view of each. */
function record(actions: Action[]): { state: SessionState; events: StudyEvent[] } {
  let state = createSession(WS);
  const events: StudyEvent[] = [];
  actions.forEach((action, i) => {
    const event = studyEvent(action, state, i * 100);
    if (event) events.push(event);
    state = reduce(state, action);
  });
  return { state, events };
}

const edit = (id: string): Action[] => [
  { type: "turn_start" },
  { type: "stream", event: { type: "block_start", index: 0, block: { tool: "edit_file", id } } },
  {
    type: "stream",
    event: {
      type: "turn_end",
      message: {
        content: [{ type: "tool_use", id, name: "edit_file", input: { path: "index.html", old_text: "abuot", new_text: "about" } } as Anthropic.ToolUseBlock],
        stop_reason: "tool_use",
        usage: { input_tokens: 1, output_tokens: 1 } as Anthropic.Usage,
      },
    },
  },
];

test("the task message isn't an event; a follow-up is", () => {
  const { events } = record([{ type: "user_message", text: "Fix the link" }]);
  assert.deepEqual(events, []);
  const later = record([{ type: "user_message", text: "Fix the link" }, { type: "interrupt" }, { type: "user_message", text: "and the footer" }]);
  // The interrupt did nothing (no run was in flight), so it isn't an event.
  assert.deepEqual(later.events.map((e) => e.kind), ["follow_up"]);
});

test("decisions are recorded with their size, and a rejection's reason never is", () => {
  const { events } = record([{ type: "user_message", text: "Fix the link" }, ...edit("e1"), { type: "reject", id: "e1", reason: "Use an absolute URL instead" }]);
  const reject = events.find((e) => e.kind === "reject")!;
  assert.deepEqual(reject.data, { tool: "edit_file", added: 1, removed: 1, gaveReason: true, reasonLength: 27 });
  assert.equal(JSON.stringify(events).includes("absolute"), false, "no typed text in the events");
});

test("turns are timed and counted", () => {
  const { events } = record([{ type: "user_message", text: "Fix the link" }, ...edit("e1"), { type: "approve", id: "e1" }]);
  assert.deepEqual(
    events.map((e) => [e.kind, e.t]),
    [
      ["turn_start", 100],
      ["turn_end", 300],
      ["approve", 400],
    ],
  );
  assert.deepEqual(events[1]!.data, { turn: 1, stop: "tool_use", calls: 1 });
});

test("notes and stops record when they happened, not what was said", () => {
  const { events } = record([{ type: "user_message", text: "Fix the link" }, { type: "turn_start" }, { type: "note", text: "keep it short" }, { type: "interrupt" }]);
  assert.deepEqual(events.slice(1).map((e) => e.data), [{ length: 13, during: "streaming" }, { during: "streaming" }]);
});

test("actions the session ignores record nothing", () => {
  const { events } = record([{ type: "user_message", text: "Fix the link" }, ...edit("e1"), { type: "approve", id: "e1" }, { type: "approve", id: "e1" }, { type: "undo", id: "nope" }, { type: "review_done" }, { type: "note", text: "  " }]);
  assert.deepEqual(events.map((e) => e.kind), ["turn_start", "turn_end", "approve"]);
});

test("participant ids are random-looking and carry nothing else", () => {
  assert.match(participantId(), /^p-[0-9a-f]{8}$/);
  assert.equal(participantId((n) => new Uint8Array(n)), "p-00000000");
  assert.notEqual(participantId(), participantId());
});

test("a session summary counts what happened", () => {
  const { events } = record([{ type: "user_message", text: "Fix the link" }, ...edit("e1"), { type: "approve", id: "e1" }, { type: "undo", id: "e1" }]);
  const summary = summarizeSession({ id: "s1", task: "broken-link", mode: "replay", variant: createSession(WS).variant, startedAt: "", events });
  assert.equal(summary.turns, 1);
  assert.equal(summary.approved, 1);
  assert.equal(summary.undone, 1);
  assert.equal(summary.durationMs, 500);
});
