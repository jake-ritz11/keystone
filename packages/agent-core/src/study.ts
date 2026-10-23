/**
 * Study instrumentation, kept pure so the data dictionary is code. `studyEvent` turns a session
 * action into the event the study records, or into nothing. It records what happened and when,
 * never what anyone typed: a rejection records whether a reason was given and how long it was,
 * not the reason. The only free text in a record is a suggestion the participant writes for the
 * study on purpose.
 */
import type { Action, SessionState, ToolItem, Variant } from "./session.ts";

export type StudyEventKind =
  | "turn_start"
  | "turn_end"
  | "approve"
  | "reject"
  | "undo"
  | "plan_approved"
  | "note"
  | "stop"
  | "review_done"
  | "expand"
  | "follow_up";

export interface StudyEvent {
  /** Milliseconds since the session started. */
  t: number;
  kind: StudyEventKind;
  data?: Record<string, string | number | boolean>;
}

export interface Rating {
  /** 1 (strongly disagree) to 5 (strongly agree). */
  control: number;
  trust: number;
  effort: number;
}

export interface StudySession {
  id: string;
  task: string;
  mode: "replay" | "live";
  variant: Variant;
  startedAt: string;
  endedAt?: string;
  /** How the session ended, when it did. */
  outcome?: "done" | "stopped" | "error";
  events: StudyEvent[];
  rating?: Rating;
}

export interface Suggestion {
  at: string;
  /** What the participant was looking at, so the suggestion has context. */
  task?: string;
  variant?: Variant;
  text: string;
}

export interface StudyRecord {
  version: 1;
  /** Random, generated in the browser; not linked to anything about the person. */
  participant: string;
  consentedAt: string;
  sessions: StudySession[];
  suggestions: Suggestion[];
}

export const RATING_STATEMENTS: Record<keyof Rating, string> = {
  control: "I felt in control of what the agent did.",
  trust: "I trusted the changes it made.",
  effort: "Working with it took little effort.",
};

const tool = (state: SessionState, id: string) =>
  state.items.find((i): i is ToolItem => i.type === "tool" && i.id === id);

/**
 * The study's view of one action, given the state it was applied to. An action the session
 * would ignore (approving something that isn't waiting, stopping when nothing runs) records
 * nothing, so every event is something that actually happened.
 */
export function studyEvent(action: Action, before: SessionState, t: number): StudyEvent | null {
  switch (action.type) {
    case "turn_start":
      return { t, kind: "turn_start", data: { turn: before.turn + 1 } };
    case "stream":
      if (action.event.type === "turn_end") {
        const calls = action.event.message.content.filter((b) => b.type === "tool_use").length;
        return { t, kind: "turn_end", data: { turn: before.turn, stop: action.event.message.stop_reason ?? "unknown", calls } };
      }
      if (action.event.type === "turn_error") return { t, kind: "turn_end", data: { turn: before.turn, stop: "error", calls: 0 } };
      return null;
    case "approve":
    case "reject":
    case "undo": {
      const item = tool(before, action.id);
      const applies = action.type === "undo" ? item?.status === "applied" : item?.status === "awaiting";
      if (!item || !applies) return null;
      const data: Record<string, string | number | boolean> = { tool: item.name, added: item.stats?.added ?? 0, removed: item.stats?.removed ?? 0 };
      if (action.type === "reject") {
        const reason = action.reason?.trim() ?? "";
        data.gaveReason = reason.length > 0;
        data.reasonLength = reason.length;
      }
      return { t, kind: action.type, data };
    }
    case "approve_plan": {
      if (before.planApproved || before.status !== "waiting") return null;
      const feedback = action.feedback?.trim() ?? "";
      return { t, kind: "plan_approved", data: { steps: before.plan?.length ?? 0, gaveFeedback: feedback.length > 0 } };
    }
    case "note":
      if (!action.text.trim()) return null;
      return { t, kind: "note", data: { length: action.text.trim().length, during: before.status } };
    case "interrupt":
      if (before.status !== "streaming" && before.status !== "waiting") return null;
      return { t, kind: "stop", data: { during: before.status } };
    case "review_done":
      return before.status === "review" ? { t, kind: "review_done" } : null;
    case "user_message":
      // The first message is the task itself; later ones are the participant following up.
      if (!action.text.trim() || before.status === "streaming") return null;
      return before.items.length > 0 ? { t, kind: "follow_up", data: { length: action.text.trim().length } } : null;
    default:
      return null;
  }
}

/** A random participant id, e.g. "p-7f3a9c21", from the platform's cryptographic random source. */
export function participantId(bytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  return `p-${Array.from(bytes(4), (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Plain numbers per session, for the analysis and the participant's own summary. */
export function summarizeSession(session: StudySession) {
  const count = (kind: StudyEventKind) => session.events.filter((e) => e.kind === kind).length;
  const last = session.events.at(-1)?.t ?? 0;
  return {
    durationMs: last,
    turns: count("turn_start"),
    approved: count("approve"),
    rejected: count("reject"),
    undone: count("undo"),
    notes: count("note"),
    stops: count("stop"),
    expands: count("expand"),
  };
}
