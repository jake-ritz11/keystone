/**
 * One task, one condition, one run: the model writes files with a `write_file` tool until it
 * calls `finish` or runs out of turns. In the "mcp" condition it also has the Keystone MCP
 * server's read and check tools, answered by the same functions the server uses.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { auditComponent, DESCRIPTIONS, getComponent, getTokens, type ToolText } from "@keystone-ui/mcp/tools";
import type { WrittenFile } from "./score.ts";
import type { EvalTask } from "./tasks.ts";

export type Condition = "baseline" | "mcp";
export const CONDITIONS: Condition[] = ["baseline", "mcp"];

type Message = Anthropic.Beta.BetaMessage;
type Params = Anthropic.Beta.MessageCreateParamsNonStreaming;
/** Sends one request. The real one calls the API; tests pass a scripted one. */
export type Send = (params: Params) => Promise<Message>;

export interface RunResult {
  task: string;
  condition: Condition;
  run: number;
  /** "finished": called finish. "turns": hit the turn limit. "refused" or "fallback": excluded from scoring. */
  outcome: "finished" | "turns" | "refused" | "fallback" | "error";
  error?: string;
  files: WrittenFile[];
  toolCalls: Record<string, number>;
  turns: number;
  usage: { input: number; output: number; cacheRead: number };
}

export const MAX_TURNS = 16;

const SYSTEM = [
  "You are building UI in a React and TypeScript codebase that uses the Keystone design system: components from",
  '"@keystone-ui/ui" and design tokens as --ks-* CSS variables.',
  "Build what the user asks for as one component file (.tsx) and, if it needs styles, a CSS module beside it.",
  "Use Keystone components where they fit, and tokens for every color and spacing value.",
  "Write each file with write_file, then call finish. Don't explain the code in prose; the files are the answer.",
].join(" ");

const MCP_NOTE =
  "You also have the Keystone MCP server's tools: get_tokens for the tokens, get_component for the component reference, and audit_component to check a file against the rules.";

const tool = (name: string, description: string, properties: Record<string, unknown>, required: string[]): Anthropic.Beta.BetaTool => ({
  name,
  description,
  input_schema: { type: "object", properties, required, additionalProperties: false },
  strict: true,
});

const WRITE_TOOLS = [
  tool("write_file", "Writes one file of your answer, replacing it if it exists.", { path: { type: "string", description: "File name, e.g. DeleteProject.tsx" }, contents: { type: "string" } }, ["path", "contents"]),
  tool("finish", "Call once every file is written.", {}, []),
];

const MCP_TOOLS = [
  tool("get_tokens", DESCRIPTIONS.get_tokens, {}, []),
  tool("get_component", DESCRIPTIONS.get_component, { name: { type: "string", description: 'Component name, e.g. "Dialog". Empty to list them all.' } }, ["name"]),
  tool("audit_component", DESCRIPTIONS.audit_component, { filename: { type: "string" }, source: { type: "string" } }, ["filename", "source"]),
];

export function requestFor(task: EvalTask, condition: Condition, model: string, messages: Anthropic.Beta.BetaMessageParam[]): Params {
  return {
    model,
    max_tokens: 16000,
    // Effort is fixed so that both conditions think the same amount; only the tools differ.
    output_config: { effort: "medium" },
    system: condition === "mcp" ? `${SYSTEM}\n\n${MCP_NOTE}` : SYSTEM,
    tools: condition === "mcp" ? [...WRITE_TOOLS, ...MCP_TOOLS] : WRITE_TOOLS,
    // A declined request is re-run on another model inside the same call. That run would no longer
    // measure this model, so it's recorded and left out of the scores rather than silently kept.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages,
  };
}

function answer(name: string, input: Record<string, unknown>, files: Map<string, string>): ToolText {
  switch (name) {
    case "finish":
      return { text: "Done." };
    case "write_file": {
      const path = String(input.path ?? "");
      if (!/^[\w.-]+\.(tsx|ts|css)$/.test(path)) return { text: "Use a plain file name ending in .tsx, .ts or .css, with no folders.", isError: true };
      files.set(path, String(input.contents ?? ""));
      return { text: `Wrote ${path}.` };
    }
    case "get_tokens":
      return getTokens();
    case "get_component":
      return getComponent(String(input.name ?? "") || undefined);
    case "audit_component":
      return auditComponent(String(input.filename ?? ""), String(input.source ?? ""));
    default:
      return { text: `No tool named ${name}.`, isError: true };
  }
}

export async function runOne(send: Send, task: EvalTask, condition: Condition, run: number, model: string): Promise<RunResult> {
  const files = new Map<string, string>();
  const result: RunResult = { task: task.id, condition, run, outcome: "turns", files: [], toolCalls: {}, turns: 0, usage: { input: 0, output: 0, cacheRead: 0 } };
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: task.prompt }];

  try {
    while (result.turns < MAX_TURNS) {
      const response = await send(requestFor(task, condition, model, messages));
      result.turns++;
      result.usage.input += response.usage.input_tokens;
      result.usage.output += response.usage.output_tokens;
      result.usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;

      if ((response.usage.iterations ?? []).some((entry) => entry.type === "fallback_message")) {
        result.outcome = "fallback";
        break;
      }
      if (response.stop_reason === "refusal") {
        result.outcome = "refused";
        break;
      }
      messages.push({ role: "assistant", content: response.content });
      const calls = response.content.filter((block): block is Anthropic.Beta.BetaToolUseBlock => block.type === "tool_use");
      // Every call is answered, including writes sent alongside finish, before deciding whether to stop.
      const results = calls.map((call) => {
        result.toolCalls[call.name] = (result.toolCalls[call.name] ?? 0) + 1;
        const { text, isError } = answer(call.name, call.input as Record<string, unknown>, files);
        return { type: "tool_result" as const, tool_use_id: call.id, content: text, ...(isError ? { is_error: true } : {}) };
      });
      // No calls means it answered in prose instead of calling finish; whatever it wrote stands.
      if (calls.length === 0 || calls.some((call) => call.name === "finish")) {
        result.outcome = "finished";
        break;
      }
      messages.push({ role: "user", content: results });
    }
  } catch (error) {
    result.outcome = "error";
    result.error = error instanceof Error ? error.message : String(error);
  }

  result.files = [...files].map(([path, contents]) => ({ path, contents }));
  return result;
}
