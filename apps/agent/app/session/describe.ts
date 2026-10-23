import type { ToolItem, ToolStatus } from "@keystone-ui/agent-core";

type Tone = "neutral" | "accent" | "success" | "danger";

const input = (item: ToolItem) => (item.input ?? {}) as Record<string, unknown>;

/** The path a tool call is about, read from its finished input or, mid-stream, its partial JSON. */
export function toolPath(item: ToolItem): string | undefined {
  const path = input(item).path;
  if (typeof path === "string") return path;
  return /"path"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(item.partialInput)?.[1];
}

/** A one-line, past-tense (or in-progress) description of a tool call. */
export function describeTool(item: ToolItem): string {
  const path = toolPath(item) ?? "a file";
  const writing = item.status === "streaming";
  switch (item.name) {
    case "update_plan":
      return "Updated the plan";
    case "list_files":
      return "Listed the files";
    case "read_file":
      return `Read ${path}`;
    case "search": {
      const { query, path: only } = input(item);
      const q = typeof query === "string" ? `“${query}”` : "text";
      return `Searched for ${q}${typeof only === "string" ? ` in ${only}` : ""}`;
    }
    case "edit_file":
      return writing ? `Writing an edit to ${path}` : `Edit ${path}`;
    case "create_file":
      return writing ? `Writing ${path}` : `Create ${path}`;
    case "delete_file":
      return `Delete ${path}`;
    default:
      return `Called ${item.name}`;
  }
}

export const STATUS: Record<ToolStatus, { label: string; tone: Tone } | null> = {
  streaming: { label: "Writing", tone: "accent" },
  done: null,
  failed: { label: "Failed", tone: "danger" },
  awaiting: { label: "Needs review", tone: "accent" },
  applied: { label: "Applied", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  reverted: { label: "Undone", tone: "neutral" },
};

export const isWrite = (item: ToolItem) => item.name === "edit_file" || item.name === "create_file" || item.name === "delete_file";

/** "Updated the plan, listed the files and searched once": in the order the agent did them. */
export function summarize(items: ToolItem[]): string {
  const count = (name: string) => items.filter((i) => i.name === name).length;
  const phrase: Record<string, () => string> = {
    read_file: () => `read ${count("read_file") === 1 ? "1 file" : `${count("read_file")} files`}`,
    search: () => `searched ${count("search") === 1 ? "once" : `${count("search")} times`}`,
    list_files: () => "listed the files",
    update_plan: () => "updated the plan",
  };
  const order = [...new Set(items.map((i) => i.name))].filter((n) => phrase[n]);
  const parts = order.map((n) => phrase[n]!());
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : (parts[0] ?? "worked");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
