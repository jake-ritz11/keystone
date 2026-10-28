/**
 * The session reducer: every event in an agent session (the user's messages, the model's
 * streamed turn, approvals, undo, interrupts) goes through `reduce`, which returns the next
 * state. It's pure, so the UI, replays and tests all drive the same logic.
 *
 * Two invariants matter most:
 * - `messages` is append-only. Newer models validate replayed thinking blocks against the
 *   history, so it is never edited, only extended.
 * - Every tool_use the model sends gets exactly one tool_result before the conversation goes
 *   on, including when the user rejects a call or stops the run.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { diffStats } from "./diff.ts";
import { parseToolCall, planWrite, runRead, toolKind, type PlanStep, type ToolInput, type ToolName } from "./tools.ts";
import { applyChange, revertChange, type FileChange, type Workspace } from "./workspace.ts";

export type Planning = "act" | "plan-first";
export type Approval = "each" | "end" | "auto";
export type Visibility = "timeline" | "narrative" | "outcomes";

export interface Variant {
  planning: Planning;
  approval: Approval;
  visibility: Visibility;
}

export const DEFAULT_VARIANT: Variant = { planning: "act", approval: "each", visibility: "timeline" };

export type ToolStatus =
  | "streaming" // input still arriving
  | "done" // read or meta tool finished
  | "failed" // invalid input or the tool reported an error
  | "awaiting" // write waiting for the user (approval "each", or a plan in plan-first)
  | "applied" // write applied (approved, or auto / end mode)
  | "rejected" // write the user turned down, or one stopped by an interrupt
  | "reverted"; // write undone after it was applied

export interface ToolItem {
  type: "tool";
  id: string;
  name: string;
  status: ToolStatus;
  /** Raw JSON as it streams, for showing an edit being written. */
  partialInput: string;
  input?: unknown;
  output?: string;
  error?: string;
  change?: FileChange;
  stats?: { added: number; removed: number };
  /** Approval "end": applied, but not yet reviewed by the user. */
  unreviewed?: boolean;
  note?: string;
  turn: number;
}

export type Item =
  | { type: "user"; id: string; text: string }
  | { type: "text"; id: string; text: string; streaming: boolean; turn: number }
  | { type: "progress"; id: string; text: string; turn: number }
  | ToolItem
  | { type: "notice"; id: string; tone: "info" | "danger"; text: string };

export type Status =
  | "idle" // nothing sent yet
  | "streaming" // a model turn is in flight
  | "ready" // tool results are in; the driver should send the next turn
  | "waiting" // blocked on the user (approvals or a plan)
  | "review" // the run finished with unreviewed changes (approval "end")
  | "done" // the model ended its turn
  | "stopped" // the user interrupted
  | "error";

export interface SessionState {
  variant: Variant;
  status: Status;
  messages: Anthropic.MessageParam[];
  workspace: Workspace;
  baseline: Workspace;
  plan: PlanStep[] | null;
  planApproved: boolean;
  items: Item[];
  turn: number;
  /** Notes the user added mid-run, sent with the next tool results. */
  notes: string[];
  usage: { input: number; output: number };
  /** Stream block index to the item it fills, for the turn in flight. */
  blocks: Record<number, string>;
  /** Counter for generated item ids, kept in the state so the reducer stays pure. */
  seq: number;
  error?: string;
}

/** Normalized stream events: what the live route and the replays both produce. */
export type StreamEvent =
  | { type: "block_start"; index: number; block: "text" | "thinking" | { tool: string; id: string } }
  | { type: "text_delta"; index: number; text: string }
  | { type: "thinking_delta"; index: number; text: string }
  | { type: "input_delta"; index: number; json: string }
  | { type: "turn_end"; message: Pick<Anthropic.Message, "content" | "stop_reason" | "usage"> }
  | { type: "turn_error"; message: string };

export type Action =
  | { type: "user_message"; text: string }
  | { type: "turn_start" }
  | { type: "stream"; event: StreamEvent }
  | { type: "approve"; id: string }
  | { type: "reject"; id: string; reason?: string }
  | { type: "approve_plan"; feedback?: string }
  | { type: "undo"; id: string }
  | { type: "review_done" }
  | { type: "note"; text: string }
  | { type: "interrupt" }
  | { type: "set_variant"; variant: Variant };

export function createSession(workspace: Workspace, variant: Variant = DEFAULT_VARIANT): SessionState {
  return {
    variant,
    status: "idle",
    messages: [],
    workspace,
    baseline: workspace,
    plan: null,
    planApproved: variant.planning === "act",
    items: [],
    turn: 0,
    notes: [],
    usage: { input: 0, output: 0 },
    blocks: {},
    seq: 0,
  };
}

/** The next generated id. Whatever adds the item also advances `seq`. */
const id = (state: SessionState, prefix: string) => `${prefix}-${state.seq + 1}`;

function updateItem(state: SessionState, itemId: string, patch: (item: Item) => Item): SessionState {
  return { ...state, items: state.items.map((item) => (item.id === itemId ? patch(item) : item)) };
}

const tools = (state: SessionState, turn: number) =>
  state.items.filter((i): i is ToolItem => i.type === "tool" && i.turn === turn);

export function reduce(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "user_message": {
      const text = action.text.trim();
      if (!text || state.status === "streaming") return state;
      return {
        ...state,
        status: "ready",
        error: undefined,
        messages: [...state.messages, { role: "user", content: text }],
        items: [...state.items, { type: "user", id: id(state, "user"), text }],
        seq: state.seq + 1,
      };
    }

    case "turn_start":
      return { ...state, status: "streaming", turn: state.turn + 1, blocks: {} };

    case "stream":
      return onStream(state, action.event);

    case "approve":
    case "reject": {
      const item = state.items.find((i): i is ToolItem => i.type === "tool" && i.id === action.id);
      if (!item || item.status !== "awaiting" || !item.change) return state;
      const approved = action.type === "approve";
      const next: SessionState = approved
        ? updateItem({ ...state, workspace: applyChange(state.workspace, item.change) }, item.id, (i) => ({
            ...(i as ToolItem),
            status: "applied",
            output: "The user approved this change, and it has been applied.",
          }))
        : updateItem(state, item.id, (i) => ({
            ...(i as ToolItem),
            status: "rejected",
            note: action.type === "reject" ? action.reason : undefined,
            output: `The user rejected this change${action.type === "reject" && action.reason ? `: ${action.reason}` : "."} It was not applied.`,
          }));
      return settleTurn(next);
    }

    case "approve_plan": {
      const item = [...state.items].reverse().find((i): i is ToolItem => i.type === "tool" && i.name === "update_plan" && i.status === "awaiting");
      if (!item) return state;
      const feedback = action.feedback?.trim();
      const next = updateItem({ ...state, planApproved: true }, item.id, (i) => ({
        ...(i as ToolItem),
        status: "done",
        output: feedback ? `The user approved the plan with this feedback: ${feedback}` : "The user approved the plan. Go ahead.",
      }));
      return settleTurn(next);
    }

    case "undo": {
      const item = state.items.find((i): i is ToolItem => i.type === "tool" && i.id === action.id);
      if (!item?.change || item.status !== "applied") return state;
      const next = updateItem({ ...state, workspace: applyChange(state.workspace, revertChange(item.change)) }, item.id, (i) => ({
        ...(i as ToolItem),
        status: "reverted",
        unreviewed: false,
      }));
      // The model already saw this change succeed. Tell it on the next turn.
      return { ...next, notes: [...next.notes, `The user undid your change to ${item.change.path}.`] };
    }

    case "review_done": {
      if (state.status !== "review") return state;
      return {
        ...state,
        status: "done",
        items: state.items.map((i) => (i.type === "tool" && i.unreviewed ? { ...i, unreviewed: false } : i)),
      };
    }

    case "note": {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        notes: [...state.notes, text],
        items: [...state.items, { type: "user", id: id(state, "note"), text }],
        seq: state.seq + 1,
      };
    }

    case "interrupt": {
      if (state.status === "streaming") {
        // The partial assistant turn is dropped, never appended, so history stays valid.
        const items = state.items
          .filter((i) => !(i.type === "tool" && i.turn === state.turn && i.status === "streaming"))
          .map((i) => (i.type === "text" && i.streaming ? { ...i, streaming: false } : i));
        return { ...state, status: "stopped", items: [...items, notice(state, "info", "Stopped. Send a message to continue.")], seq: state.seq + 1 };
      }
      if (state.status === "waiting") {
        let next = state;
        for (const item of tools(state, state.turn).filter((i) => i.status === "awaiting")) {
          next = updateItem(next, item.id, (i) => ({
            ...(i as ToolItem),
            status: item.name === "update_plan" ? "done" : "rejected",
            output: "The user stopped the run before deciding on this. It was not applied.",
          }));
        }
        next = settleTurn(next);
        return { ...next, status: "stopped", items: [...next.items, notice(next, "info", "Stopped. Send a message to continue.")], seq: next.seq + 1 };
      }
      return state;
    }

    case "set_variant": {
      // Only between runs: switching approval mode mid-turn would strand pending calls.
      if (state.status === "streaming" || state.status === "waiting") return state;
      return { ...state, variant: action.variant, planApproved: state.planApproved || action.variant.planning === "act" };
    }
  }
}

const notice = (state: SessionState, tone: "info" | "danger", text: string): Item => ({ type: "notice", id: id(state, "notice"), tone, text });

function withBlock(state: SessionState, index: number, item: Item): SessionState {
  return { ...state, items: [...state.items, item], blocks: { ...state.blocks, [index]: item.id }, seq: state.seq + 1 };
}

function onStream(state: SessionState, event: StreamEvent): SessionState {
  if (state.status !== "streaming") return state;
  const turn = state.turn;
  switch (event.type) {
    case "block_start": {
      if (event.block === "text") return withBlock(state, event.index, { type: "text", id: id(state, "text"), text: "", streaming: true, turn });
      if (event.block === "thinking") return withBlock(state, event.index, { type: "progress", id: id(state, "progress"), text: "", turn });
      return withBlock(state, event.index, {
        type: "tool",
        id: event.block.id,
        name: event.block.tool,
        status: "streaming",
        partialInput: "",
        turn,
      });
    }
    case "text_delta": {
      const target = state.blocks[event.index];
      if (!target) return state;
      return updateItem(state, target, (i) => (i.type === "text" ? { ...i, text: i.text + event.text } : i));
    }
    case "thinking_delta": {
      const target = state.blocks[event.index];
      if (!target) return state;
      return updateItem(state, target, (i) => (i.type === "progress" ? { ...i, text: i.text + event.text } : i));
    }
    case "input_delta": {
      const target = state.blocks[event.index];
      if (!target) return state;
      return updateItem(state, target, (i) => (i.type === "tool" ? { ...i, partialInput: i.partialInput + event.json } : i));
    }
    case "turn_error":
      return { ...state, status: "error", error: event.message, items: [...state.items, notice(state, "danger", event.message)], seq: state.seq + 1 };
    case "turn_end":
      return onTurnEnd(state, event.message);
  }
}

function onTurnEnd(state: SessionState, message: Pick<Anthropic.Message, "content" | "stop_reason" | "usage">): SessionState {
  const turn = state.turn;
  let next: SessionState = {
    ...state,
    // Appended exactly as received, thinking blocks included.
    messages: [...state.messages, { role: "assistant", content: message.content as Anthropic.ContentBlockParam[] }],
    usage: { input: state.usage.input + message.usage.input_tokens, output: state.usage.output + message.usage.output_tokens },
    items: state.items
      .map((i) => (i.type === "text" && i.turn === turn ? { ...i, streaming: false } : i))
      // Progress blocks that stayed empty (display "omitted") have nothing to show.
      .filter((i) => !(i.type === "progress" && i.turn === turn && i.text.trim() === "")),
  };

  const calls = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

  if (message.stop_reason === "refusal") {
    const resolved = resolveUnrun(next, calls, "The request was declined, so this call was not run.");
    return { ...resolved, status: "error", error: "The model declined this request.", items: [...resolved.items, notice(resolved, "danger", "The model declined this request. Rewording the task may help, or try a different one.")], seq: resolved.seq + 1 };
  }
  if (message.stop_reason === "max_tokens" && calls.length > 0) {
    // A truncated tool input can still parse, so nothing from this turn runs.
    const resolved = resolveUnrun(next, calls, "The response was cut off before this call was complete, so it was not run.");
    return {
      ...resolved,
      status: "error",
      error: "The response was cut off.",
      items: [...resolved.items, notice(resolved, "danger", "The response was cut off before the agent finished a tool call, so none of it ran. Restarting the task usually gets past it.")],
      seq: resolved.seq + 1,
    };
  }

  for (const call of calls) next = runCall(next, call, turn);
  if (calls.length === 0) return finish(next);
  return settleTurn(next);
}

/** Every call gets a result, even when none of them run. */
function resolveUnrun(state: SessionState, calls: Anthropic.ToolUseBlock[], output: string): SessionState {
  let next = state;
  for (const call of calls) {
    next = upsertTool(next, call, state.turn, { status: "failed", input: call.input, error: output, output });
  }
  return appendResults(next, state.turn);
}

function upsertTool(state: SessionState, call: Anthropic.ToolUseBlock, turn: number, patch: Partial<ToolItem>): SessionState {
  const exists = state.items.some((i) => i.id === call.id);
  if (exists) return updateItem(state, call.id, (i) => ({ ...(i as ToolItem), ...patch }));
  const item: ToolItem = { type: "tool", id: call.id, name: call.name, status: "streaming", partialInput: "", turn, ...patch };
  return { ...state, items: [...state.items, item] };
}

function runCall(state: SessionState, call: Anthropic.ToolUseBlock, turn: number): SessionState {
  const parsed = parseToolCall(call.name, call.input);
  if (!parsed.ok) return upsertTool(state, call, turn, { status: "failed", input: call.input, error: parsed.error, output: parsed.error });
  const name: ToolName = parsed.name;
  const input = parsed.input;

  if (name === "update_plan") {
    const { steps } = input as ToolInput<"update_plan">;
    const first = !state.planApproved;
    const next = { ...state, plan: steps };
    if (first && state.variant.planning === "plan-first") {
      return upsertTool(next, call, turn, { status: "awaiting", input });
    }
    return upsertTool(next, call, turn, { status: "done", input, output: "Plan updated." });
  }

  const kind = toolKind(name);
  if (kind === "read") {
    const result = runRead(state.workspace, name as "list_files" | "read_file" | "search", input);
    return upsertTool(state, call, turn, result.ok ? { status: "done", input, output: result.output } : { status: "failed", input, error: result.error, output: result.error });
  }

  if (!state.planApproved) {
    const error = "Wait for the user to approve your plan before making changes.";
    return upsertTool(state, call, turn, { status: "failed", input, error, output: error });
  }

  const planned = planWrite(state.workspace, name as "edit_file" | "create_file" | "delete_file", input);
  if (!planned.ok) return upsertTool(state, call, turn, { status: "failed", input, error: planned.error, output: planned.error });
  const change = planned.change;
  const stats = diffStats(change);

  switch (state.variant.approval) {
    case "each":
      return upsertTool(state, call, turn, { status: "awaiting", input, change, stats });
    case "end":
      return upsertTool({ ...state, workspace: applyChange(state.workspace, change) }, call, turn, {
        status: "applied",
        input,
        change,
        stats,
        unreviewed: true,
        output: "Applied. The user will review all changes when you finish.",
      });
    case "auto":
      return upsertTool({ ...state, workspace: applyChange(state.workspace, change) }, call, turn, {
        status: "applied",
        input,
        change,
        stats,
        output: "Applied.",
      });
  }
}

/** Once no call in the current turn is awaiting the user, send the results back. */
function settleTurn(state: SessionState): SessionState {
  const current = tools(state, state.turn);
  if (current.some((i) => i.status === "awaiting")) return { ...state, status: "waiting" };
  if (state.messages.at(-1)?.role !== "assistant") return state; // already settled
  return { ...appendResults(state, state.turn), status: "ready" };
}

function appendResults(state: SessionState, turn: number): SessionState {
  const results: Anthropic.ContentBlockParam[] = tools(state, turn).map((item) => ({
    type: "tool_result",
    tool_use_id: item.id,
    content: item.output ?? item.error ?? "Done.",
    ...(item.status === "failed" ? { is_error: true } : {}),
  }));
  const notes: Anthropic.ContentBlockParam[] = state.notes.map((text) => ({ type: "text", text: `Note from the user: ${text}` }));
  return { ...state, notes: [], messages: [...state.messages, { role: "user", content: [...results, ...notes] }] };
}

function finish(state: SessionState): SessionState {
  if (state.notes.length > 0) {
    // Notes that arrived during the last turn would otherwise be lost: send them on.
    const content = state.notes.map((text) => `Note from the user: ${text}`).join("\n\n");
    return { ...state, notes: [], status: "ready", messages: [...state.messages, { role: "user", content }] };
  }
  const unreviewed = state.items.some((i) => i.type === "tool" && i.unreviewed);
  return { ...state, status: unreviewed ? "review" : "done" };
}

/** Every change applied in this session, oldest first, for review and the summary. */
export function appliedChanges(state: SessionState): ToolItem[] {
  return state.items.filter((i): i is ToolItem => i.type === "tool" && i.status === "applied" && !!i.change);
}
