import { test } from "node:test";
import assert from "node:assert/strict";
import type Anthropic from "@anthropic-ai/sdk";
import { createSession, reduce, type Action, type SessionState, type Variant } from "./session.ts";
import type { Workspace } from "./workspace.ts";

const WS: Workspace = {
  "index.html": '<a href="abuot.html">About</a>\n',
  "styles.css": "body { color: black; }\n",
};

type Block =
  | { text: string }
  | { thinking: string }
  | { tool: string; id: string; input: Record<string, unknown> };

const run = (state: SessionState, ...actions: Action[]) => actions.reduce(reduce, state);

/** Streams one model turn into the session, block by block, the way the transports do. */
function turn(state: SessionState, blocks: Block[], stop: Anthropic.Message["stop_reason"] = "tool_use", begin = true): SessionState {
  let s = begin ? reduce(state, { type: "turn_start" }) : state;
  const content: Anthropic.ContentBlock[] = [];
  blocks.forEach((block, index) => {
    if ("text" in block) {
      s = run(s, { type: "stream", event: { type: "block_start", index, block: "text" } }, { type: "stream", event: { type: "text_delta", index, text: block.text } });
      content.push({ type: "text", text: block.text, citations: null } as Anthropic.TextBlock);
    } else if ("thinking" in block) {
      s = run(s, { type: "stream", event: { type: "block_start", index, block: "thinking" } }, { type: "stream", event: { type: "thinking_delta", index, text: block.thinking } });
      content.push({ type: "thinking", thinking: block.thinking, signature: "sig" } as Anthropic.ThinkingBlock);
    } else {
      s = run(
        s,
        { type: "stream", event: { type: "block_start", index, block: { tool: block.tool, id: block.id } } },
        { type: "stream", event: { type: "input_delta", index, json: JSON.stringify(block.input) } },
      );
      content.push({ type: "tool_use", id: block.id, name: block.tool, input: block.input } as Anthropic.ToolUseBlock);
    }
  });
  return reduce(s, {
    type: "stream",
    event: { type: "turn_end", message: { content, stop_reason: stop, usage: { input_tokens: 10, output_tokens: 5 } as Anthropic.Usage } },
  });
}

/** The API's rules: starts with user, and every tool_use is answered once, in the next message. */
function assertValidConversation(messages: Anthropic.MessageParam[]) {
  assert.equal(messages[0]?.role, "user");
  messages.forEach((message, i) => {
    if (message.role !== "assistant" || typeof message.content === "string") return;
    const uses = message.content.filter((b) => b.type === "tool_use").map((b) => (b as Anthropic.ToolUseBlockParam).id);
    if (uses.length === 0) return;
    const reply = messages[i + 1];
    assert.ok(reply && reply.role === "user" && Array.isArray(reply.content), `tool_use at ${i} needs a user reply`);
    const results = (reply.content as Anthropic.ContentBlockParam[]).filter((b) => b.type === "tool_result").map((b) => (b as Anthropic.ToolResultBlockParam).tool_use_id);
    assert.deepEqual(results, uses, `results at ${i + 1} must answer every tool_use once, in order`);
  });
}

const start = (variant: Partial<Variant> = {}) =>
  reduce(createSession(WS, { planning: "act", approval: "each", visibility: "timeline", ...variant }), { type: "user_message", text: "Fix the broken link" });

const lastResults = (s: SessionState) => (s.messages.at(-1)?.content as Anthropic.ToolResultBlockParam[]).filter((b) => b.type === "tool_result");
const tool = (s: SessionState, id: string) => s.items.find((i) => i.id === id) as Extract<SessionState["items"][number], { type: "tool" }>;

test("reads run at once and their results go back together", () => {
  const s = turn(start(), [
    { text: "Looking around." },
    { tool: "list_files", id: "t1", input: {} },
    { tool: "read_file", id: "t2", input: { path: "index.html" } },
  ]);
  assert.equal(s.status, "ready");
  assert.equal(lastResults(s).length, 2);
  assert.match(String(lastResults(s)[1]?.content), /abuot\.html/);
  assertValidConversation(s.messages);
});

test("the assistant turn is appended exactly as received, thinking included", () => {
  const s = turn(start(), [{ thinking: "Checking the nav first." }, { tool: "list_files", id: "t1", input: {} }]);
  const assistant = s.messages[1]!;
  assert.equal(assistant.role, "assistant");
  assert.equal((assistant.content as Anthropic.ContentBlockParam[])[0]!.type, "thinking");
  assert.equal(s.items.some((i) => i.type === "progress" && i.text === "Checking the nav first."), true);
});

test("approval each: an edit waits, then approve applies it", () => {
  let s = turn(start(), [{ tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "about" } }]);
  assert.equal(s.status, "waiting");
  assert.equal(s.workspace["index.html"], WS["index.html"], "nothing applied before approval");
  assert.deepEqual(tool(s, "e1").stats, { added: 1, removed: 1 });
  s = reduce(s, { type: "approve", id: "e1" });
  assert.equal(s.status, "ready");
  assert.match(s.workspace["index.html"] ?? "", /about\.html/);
  assertValidConversation(s.messages);
});

test("approval each: reject sends the reason back and changes nothing", () => {
  let s = turn(start(), [{ tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "about" } }]);
  s = reduce(s, { type: "reject", id: "e1", reason: "Use an absolute URL" });
  assert.equal(s.workspace, WS);
  assert.match(String(lastResults(s)[0]?.content), /rejected this change: Use an absolute URL/);
  assertValidConversation(s.messages);
});

test("a turn with several calls settles only when every approval is in", () => {
  let s = turn(start(), [
    { tool: "read_file", id: "r1", input: { path: "styles.css" } },
    { tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "about" } },
    { tool: "edit_file", id: "e2", input: { path: "styles.css", old_text: "black", new_text: "#111" } },
  ]);
  s = reduce(s, { type: "approve", id: "e2" });
  assert.equal(s.status, "waiting");
  assert.equal(s.messages.at(-1)?.role, "assistant");
  s = reduce(s, { type: "reject", id: "e1" });
  assert.equal(s.status, "ready");
  assert.deepEqual(lastResults(s).map((r) => r.tool_use_id), ["r1", "e1", "e2"]);
  assertValidConversation(s.messages);
});

test("approval end: edits apply at once, then wait for review when the run ends", () => {
  let s = turn(start({ approval: "end" }), [{ tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "about" } }]);
  assert.equal(s.status, "ready");
  assert.equal(tool(s, "e1").unreviewed, true);
  s = turn(s, [{ text: "Fixed the link." }], "end_turn");
  assert.equal(s.status, "review");
  s = reduce(s, { type: "review_done" });
  assert.equal(s.status, "done");
  assertValidConversation(s.messages);
});

test("undo reverts the file and tells the agent on the next turn", () => {
  let s = turn(start({ approval: "auto" }), [{ tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "about" } }]);
  s = reduce(s, { type: "undo", id: "e1" });
  assert.equal(s.workspace["index.html"], WS["index.html"]);
  assert.equal(tool(s, "e1").status, "reverted");
  s = turn(s, [{ tool: "list_files", id: "l1", input: {} }]);
  const last = s.messages.at(-1)!.content as Anthropic.ContentBlockParam[];
  assert.equal(last.some((b) => b.type === "text" && b.text.includes("undid your change to index.html")), true);
  assertValidConversation(s.messages);
});

test("plan first: edits wait for the plan, and feedback goes back with the approval", () => {
  let s = turn(start({ planning: "plan-first" }), [
    { tool: "update_plan", id: "p1", input: { steps: [{ title: "Fix the About link", status: "pending" }] } },
    { tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "about" } },
  ]);
  assert.equal(s.status, "waiting");
  assert.equal(tool(s, "e1").status, "failed", "no edits before the plan is approved");
  s = reduce(s, { type: "approve_plan", feedback: "Also check about.html" });
  assert.equal(s.status, "ready");
  assert.equal(s.planApproved, true);
  assert.match(String(lastResults(s)[0]?.content), /feedback: Also check about\.html/);
  assertValidConversation(s.messages);
});

test("invalid input and escaping paths fail as tool errors, not crashes", () => {
  const s = turn(start(), [
    { tool: "read_file", id: "r1", input: { file: "index.html" } },
    { tool: "read_file", id: "r2", input: { path: "../../etc/passwd" } },
    { tool: "shell", id: "x1", input: { cmd: "ls" } },
  ]);
  const results = lastResults(s);
  assert.deepEqual(results.map((r) => r.is_error), [true, true, true]);
  assertValidConversation(s.messages);
});

test("a cut-off turn runs none of its calls but still answers them", () => {
  const s = turn(start(), [{ tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "ab" } }], "max_tokens");
  assert.equal(s.status, "error");
  assert.equal(s.workspace, WS);
  assertValidConversation(s.messages);
});

test("interrupting a stream drops the partial turn; history stays valid", () => {
  let s = reduce(start(), { type: "turn_start" });
  s = run(s, { type: "stream", event: { type: "block_start", index: 0, block: { tool: "edit_file", id: "e1" } } }, { type: "stream", event: { type: "input_delta", index: 0, json: '{"path":"ind' } });
  s = reduce(s, { type: "interrupt" });
  assert.equal(s.status, "stopped");
  assert.equal(s.messages.length, 1);
  assert.equal(s.items.some((i) => i.id === "e1"), false);
  s = reduce(s, { type: "user_message", text: "Actually, leave the link." });
  assert.equal(s.status, "ready");
});

test("interrupting while waiting answers every pending call", () => {
  let s = turn(start(), [{ tool: "edit_file", id: "e1", input: { path: "index.html", old_text: "abuot", new_text: "about" } }]);
  s = reduce(s, { type: "interrupt" });
  assert.equal(s.status, "stopped");
  assert.equal(tool(s, "e1").status, "rejected");
  s = reduce(s, { type: "user_message", text: "Stop there." });
  assertValidConversation(s.messages);
});

test("a note added mid-run reaches the agent even if the turn ends without tools", () => {
  let s = reduce(start(), { type: "turn_start" });
  s = reduce(s, { type: "note", text: "Keep the old link working too" });
  s = turn(s, [{ text: "Done." }], "end_turn", false);
  assert.equal(s.status, "ready");
  assert.match(String(s.messages.at(-1)?.content), /Keep the old link working too/);
});
