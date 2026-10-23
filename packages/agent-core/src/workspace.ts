/**
 * The agent's sandbox: an immutable map of path to file contents. Nothing here touches a real
 * filesystem, and every path the model supplies is normalized and confined to the map.
 */

export type Workspace = Readonly<Record<string, string>>;

/** One file's change. `before` null means created, `after` null means deleted. */
export interface FileChange {
  path: string;
  before: string | null;
  after: string | null;
}

export const LIMITS = {
  pathLength: 120,
  depth: 4,
  fileBytes: 100_000,
  files: 40,
} as const;

export class PathError extends Error {}

const SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * Turns a model-supplied path into a workspace key, or throws a PathError that reads well
 * as a tool error. Accepts "./a", "/a" and "a\\b" spellings; rejects anything that climbs out.
 */
export function normalizePath(input: string): string {
  const trimmed = input.trim().replace(/\\/g, "/").replace(/^\.?\//, "");
  if (trimmed === "") throw new PathError("Path is empty.");
  if (trimmed.length > LIMITS.pathLength) throw new PathError(`Path is longer than ${LIMITS.pathLength} characters.`);
  const segments = trimmed.split("/").filter((s) => s !== "" && s !== ".");
  if (segments.length === 0) throw new PathError("Path names no file.");
  if (segments.length > LIMITS.depth) throw new PathError(`Paths can be at most ${LIMITS.depth} levels deep.`);
  for (const segment of segments) {
    if (segment === "..") throw new PathError("Paths can't go above the workspace root.");
    if (!SEGMENT.test(segment)) {
      throw new PathError(`"${segment}" has characters a path can't use. Use letters, digits, dot, dash or underscore.`);
    }
  }
  return segments.join("/");
}

export function paths(workspace: Workspace): string[] {
  return Object.keys(workspace).sort();
}

export function applyChange(workspace: Workspace, change: FileChange): Workspace {
  const next: Record<string, string> = { ...workspace };
  if (change.after === null) delete next[change.path];
  else next[change.path] = change.after;
  return next;
}

/** The inverse change, for undo. */
export function revertChange(change: FileChange): FileChange {
  return { path: change.path, before: change.after, after: change.before };
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
