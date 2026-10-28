import { test } from "node:test";
import assert from "node:assert/strict";
import type Anthropic from "@anthropic-ai/sdk";
import { requestFor, runOne, type Send } from "./loop.ts";
import { report, type ResultsFile } from "./report.ts";
import { TASKS } from "./tasks.ts";

const task = TASKS.find((t) => t.id === "faq")!;
type Block = Anthropic.Beta.BetaContentBlock;

/** A model that sends the given turns in order, and records what it was sent. */
function scripted(turns: { content: Partial<Block>[]; stop?: string; fallback?: boolean }[]) {
  const sent: Anthropic.Beta.MessageCreateParamsNonStreaming[] = [];
  const send: Send = async (params) => {
    sent.push(structuredClone(params));
    const turn = turns[sent.length - 1]!;
    return {
      content: turn.content as Block[],
      stop_reason: turn.stop ?? "tool_use",
      usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 0, ...(turn.fallback ? { iterations: [{ type: "fallback_message" }] } : {}) },
    } as unknown as Anthropic.Beta.BetaMessage;
  };
  return { send, sent };
}

const call = (name: string, input: object, id = name) => ({ type: "tool_use" as const, id, name, input });

test("baseline gets only the write tools; mcp also gets the server's tools", () => {
  const names = (condition: "baseline" | "mcp") => requestFor(task, condition, "m", []).tools!.map((t) => ("name" in t ? t.name : ""));
  assert.deepEqual(names("baseline"), ["write_file", "finish"]);
  assert.deepEqual(names("mcp"), ["write_file", "finish", "get_tokens", "get_component", "audit_component"]);
  // Same system prompt apart from the note about the tools.
  const base = requestFor(task, "baseline", "m", []).system as string;
  assert.ok((requestFor(task, "mcp", "m", []).system as string).startsWith(base));
});

test("a run answers the MCP tools with the server's text, collects files, and stops at finish", async () => {
  const { send, sent } = scripted([
    { content: [call("get_component", { name: "Accordion" })] },
    { content: [call("write_file", { path: "Faq.tsx", contents: 'import { Accordion } from "@keystone-ui/ui";' }), call("finish", {}, "f")] },
  ]);
  const result = await runOne(send, task, "mcp", 1, "m");
  assert.equal(result.outcome, "finished");
  assert.equal(result.turns, 2);
  assert.deepEqual(result.toolCalls, { get_component: 1, write_file: 1, finish: 1 });
  // The file sent alongside finish is kept.
  assert.deepEqual(result.files.map((f) => f.path), ["Faq.tsx"]);
  const reply = (sent[1]!.messages.at(-1)!.content as Anthropic.Beta.BetaToolResultBlockParam[])[0]!;
  assert.match(String(reply.content), /^## Accordion/);
  assert.equal(result.usage.input, 200);
});

test("bad file names are refused, and a fallback or refusal ends the run unscored", async () => {
  const { send, sent } = scripted([{ content: [call("write_file", { path: "../x.tsx", contents: "" })] }, { content: [], stop: "end_turn" }]);
  const result = await runOne(send, task, "baseline", 1, "m");
  assert.equal(result.files.length, 0);
  assert.equal((sent[1]!.messages.at(-1)!.content as Anthropic.Beta.BetaToolResultBlockParam[])[0]!.is_error, true);

  assert.equal((await runOne(scripted([{ content: [], fallback: true }]).send, task, "mcp", 1, "m")).outcome, "fallback");
  assert.equal((await runOne(scripted([{ content: [], stop: "refusal" }]).send, task, "mcp", 1, "m")).outcome, "refused");
});

test("the report gives counts out of the runs scored, and lists what it left out", async () => {
  const good = (await runOne(scripted([{ content: [call("write_file", { path: "Faq.tsx", contents: 'import { Accordion } from "@keystone-ui/ui";' }), call("finish", {}, "f")] }]).send, task, "mcp", 1, "m"));
  const bad = (await runOne(scripted([{ content: [call("write_file", { path: "Faq.module.css", contents: ".a { color: #000; }" }), call("finish", {}, "f")] }]).send, task, "baseline", 1, "m"));
  const refused = await runOne(scripted([{ content: [], stop: "refusal" }]).send, task, "baseline", 2, "m");
  const file: ResultsFile = { model: "m", startedAt: "now", runsPerTask: 1, results: [good, bad, refused] };
  const text = report(file);
  assert.match(text, /\| Runs with no findings, invented imports or invented props \| 0 of 1 \| 1 of 1 \|/);
  assert.match(text, /\| faq \| 1\.0 \| 0\.0 \| 0% \| 100% \|/);
  assert.match(text, /Not scored: faq baseline run 2 \(refused\)/);
});
