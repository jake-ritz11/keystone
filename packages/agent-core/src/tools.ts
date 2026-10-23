/**
 * The agent's tools: their API definitions, input schemas, and executors. Executors are pure:
 * read tools return output, write tools return a FileChange that the UI can show for approval
 * before anything is applied.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { byteLength, LIMITS, normalizePath, PathError, paths, type FileChange, type Workspace } from "./workspace.ts";

export type ToolKind = "meta" | "read" | "write";

const path = z.string().describe('Workspace-relative path, e.g. "styles.css" or "pages/about.html"');

export const PlanStep = z.strictObject({
  title: z.string().min(1).max(120).describe("One short, concrete step"),
  status: z.enum(["pending", "in_progress", "done"]),
});
export type PlanStep = z.infer<typeof PlanStep>;

const schemas = {
  update_plan: z.strictObject({ steps: z.array(PlanStep).min(1).max(12) }),
  list_files: z.strictObject({}),
  read_file: z.strictObject({ path }),
  search: z.strictObject({
    query: z.string().min(1).max(200).describe("Text to find. A regular expression when regex is true."),
    regex: z.boolean().optional().describe("Treat query as a JavaScript regular expression"),
    path: path.optional().describe("Search only this file"),
  }),
  edit_file: z.strictObject({
    path,
    old_text: z.string().min(1).describe("Exact text to replace, including whitespace. Must appear exactly once in the file."),
    new_text: z.string().describe("The replacement text"),
  }),
  create_file: z.strictObject({ path, content: z.string() }),
  delete_file: z.strictObject({ path }),
};

export type ToolName = keyof typeof schemas;
export type ToolInput<N extends ToolName> = z.infer<(typeof schemas)[N]>;

interface ToolSpec {
  kind: ToolKind;
  description: string;
  /** Stream this tool's input as it's generated, so the UI can show an edit being written. */
  eager?: boolean;
}

const SPECS: Record<ToolName, ToolSpec> = {
  update_plan: {
    kind: "meta",
    description:
      "Set or update your plan for the task as a short checklist. Call it before your first edit, and again whenever a step's status changes. The user sees it as a live checklist.",
  },
  list_files: { kind: "read", description: "List every file in the workspace with its size in bytes." },
  read_file: { kind: "read", description: "Read one file's full contents. Lines are numbered for reference; the numbers aren't part of the file." },
  search: {
    kind: "read",
    description: "Find text across the workspace, or in one file. Returns matching lines with their paths and line numbers.",
  },
  edit_file: {
    kind: "write",
    eager: true,
    description:
      "Replace one exact snippet in a file. old_text must match the file exactly, including indentation, and appear exactly once; include a few surrounding lines to make it unique. The user reviews every edit as a diff, and may reject it.",
  },
  create_file: {
    kind: "write",
    eager: true,
    description: "Create a new file. Fails if the file already exists; use edit_file to change existing files.",
  },
  delete_file: { kind: "write", description: "Delete a file. The user must approve it." },
};

export const TOOL_NAMES = Object.keys(SPECS) as ToolName[];

export function isToolName(name: string): name is ToolName {
  return Object.hasOwn(SPECS, name);
}

export function toolKind(name: ToolName): ToolKind {
  return SPECS[name].kind;
}

/** Tool definitions for the Messages API. */
export function apiTools(): Anthropic.Tool[] {
  return TOOL_NAMES.map((name) => {
    const { $schema: _, ...schema } = z.toJSONSchema(schemas[name]) as Record<string, unknown>;
    return {
      name,
      description: SPECS[name].description,
      input_schema: schema as Anthropic.Tool.InputSchema,
      ...(SPECS[name].eager ? { eager_input_streaming: true } : {}),
    };
  });
}

export type Parsed = { ok: true; name: ToolName; input: unknown } | { ok: false; error: string };

/**
 * Validates a tool call from the model. Input that arrives through eager streaming isn't
 * checked by the API, so this is the only gate between the model and the executors.
 */
export function parseToolCall(name: string, input: unknown): Parsed {
  if (!isToolName(name)) return { ok: false, error: `There's no tool named "${name}".` };
  const result = schemas[name].safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
    return { ok: false, error: `Invalid input for ${name}: ${issues}` };
  }
  return { ok: true, name, input: result.data };
}

export type ReadResult = { ok: true; output: string } | { ok: false; error: string };
export type WriteResult = { ok: true; change: FileChange } | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof PathError) return { ok: false, error: error.message };
  throw error;
}

const numbered = (text: string) =>
  text
    .split("\n")
    .map((line, i) => `${String(i + 1).padStart(4)}  ${line}`)
    .join("\n");

export function runRead(workspace: Workspace, name: "list_files" | "read_file" | "search", input: unknown): ReadResult {
  try {
    if (name === "list_files") {
      const list = paths(workspace).map((p) => `${p}  (${byteLength(workspace[p] ?? "")} bytes)`);
      return { ok: true, output: list.length ? list.join("\n") : "The workspace is empty." };
    }
    if (name === "read_file") {
      const { path: raw } = input as ToolInput<"read_file">;
      const p = normalizePath(raw);
      const text = workspace[p];
      if (text === undefined) return { ok: false, error: `No file at "${p}". Files: ${paths(workspace).join(", ")}` };
      return { ok: true, output: numbered(text) };
    }
    const { query, regex, path: only } = input as ToolInput<"search">;
    let test: (line: string) => boolean;
    if (regex) {
      let pattern: RegExp;
      try {
        pattern = new RegExp(query);
      } catch {
        return { ok: false, error: `"${query}" isn't a valid regular expression.` };
      }
      test = (line) => pattern.test(line);
    } else {
      test = (line) => line.includes(query);
    }
    const scope = only ? [normalizePath(only)] : paths(workspace);
    const hits: string[] = [];
    for (const p of scope) {
      const text = workspace[p];
      if (text === undefined) return { ok: false, error: `No file at "${p}".` };
      text.split("\n").forEach((line, i) => {
        if (test(line)) hits.push(`${p}:${i + 1}: ${line.trim()}`);
      });
    }
    const shown = hits.slice(0, 50);
    const more = hits.length > shown.length ? `\n…and ${hits.length - shown.length} more` : "";
    return { ok: true, output: hits.length ? shown.join("\n") + more : `No matches for "${query}".` };
  } catch (error) {
    return fail(error);
  }
}

function count(haystack: string, needle: string): number {
  let n = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) n++;
  return n;
}

/** Computes a write tool's change without applying it. */
export function planWrite(workspace: Workspace, name: "edit_file" | "create_file" | "delete_file", input: unknown): WriteResult {
  try {
    if (name === "edit_file") {
      const { path: raw, old_text, new_text } = input as ToolInput<"edit_file">;
      const p = normalizePath(raw);
      const before = workspace[p];
      if (before === undefined) return { ok: false, error: `No file at "${p}". Use create_file for new files.` };
      const matches = count(before, old_text);
      if (matches === 0) return { ok: false, error: `old_text wasn't found in ${p}. Read the file again and copy the text exactly.` };
      if (matches > 1) return { ok: false, error: `old_text appears ${matches} times in ${p}. Include more surrounding lines so it matches once.` };
      if (old_text === new_text) return { ok: false, error: "new_text is the same as old_text, so nothing would change." };
      const after = before.replace(old_text, () => new_text);
      if (byteLength(after) > LIMITS.fileBytes) return { ok: false, error: `${p} would be larger than ${LIMITS.fileBytes} bytes.` };
      return { ok: true, change: { path: p, before, after } };
    }
    if (name === "create_file") {
      const { path: raw, content } = input as ToolInput<"create_file">;
      const p = normalizePath(raw);
      if (workspace[p] !== undefined) return { ok: false, error: `${p} already exists. Use edit_file to change it.` };
      if (Object.keys(workspace).length >= LIMITS.files) return { ok: false, error: `The workspace is limited to ${LIMITS.files} files.` };
      if (byteLength(content) > LIMITS.fileBytes) return { ok: false, error: `Files are limited to ${LIMITS.fileBytes} bytes.` };
      return { ok: true, change: { path: p, before: null, after: content } };
    }
    const { path: raw } = input as ToolInput<"delete_file">;
    const p = normalizePath(raw);
    const before = workspace[p];
    if (before === undefined) return { ok: false, error: `No file at "${p}".` };
    return { ok: true, change: { path: p, before, after: null } };
  } catch (error) {
    return fail(error);
  }
}
