/**
 * Line diffs for reviewing edits: unified-diff hunks with line numbers on both sides.
 * Common prefix and suffix are trimmed first, so the LCS table only covers the part that
 * changed; for the small files in the sandbox that's always cheap.
 */
import type { FileChange } from "./workspace.ts";

export interface DiffLine {
  kind: "context" | "add" | "remove";
  text: string;
  /** 1-based line number in the old file (context and remove). */
  oldLine?: number;
  /** 1-based line number in the new file (context and add). */
  newLine?: number;
}

export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

const split = (text: string | null): string[] => {
  if (text === null || text === "") return [];
  const lines = text.split("\n");
  // A trailing newline ends the last line rather than starting an empty one.
  if (lines.at(-1) === "") lines.pop();
  return lines;
};

/** Every line of both files, in order, marked as kept, added or removed. */
export function diffAll(before: string | null, after: string | null): DiffLine[] {
  const a = split(before);
  const b = split(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  // lcs[i][j] = length of the LCS of midA[i..] and midB[j..].
  const lcs: number[][] = Array.from({ length: midA.length + 1 }, () => new Array<number>(midB.length + 1).fill(0));
  for (let i = midA.length - 1; i >= 0; i--) {
    for (let j = midB.length - 1; j >= 0; j--) {
      lcs[i]![j] = midA[i] === midB[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const out: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  const keep = (text: string) => out.push({ kind: "context", text, oldLine: oldLine++, newLine: newLine++ });
  for (let k = 0; k < start; k++) keep(a[k]!);
  let i = 0;
  let j = 0;
  while (i < midA.length || j < midB.length) {
    if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
      keep(midA[i]!);
      i++;
      j++;
    } else if (j < midB.length && (i === midA.length || lcs[i]![j + 1]! >= lcs[i + 1]![j]!)) {
      out.push({ kind: "add", text: midB[j++]!, newLine: newLine++ });
    } else {
      out.push({ kind: "remove", text: midA[i++]!, oldLine: oldLine++ });
    }
  }
  for (let k = endA; k < a.length; k++) keep(a[k]!);
  // Removals read better before the additions that replace them.
  return reorderRuns(out);
}

function reorderRuns(lines: DiffLine[]): DiffLine[] {
  const out: DiffLine[] = [];
  let run: DiffLine[] = [];
  const flush = () => {
    out.push(...run.filter((l) => l.kind === "remove"), ...run.filter((l) => l.kind === "add"));
    run = [];
  };
  for (const line of lines) {
    if (line.kind === "context") {
      flush();
      out.push(line);
    } else {
      run.push(line);
    }
  }
  flush();
  return out;
}

/** Changed regions with `context` unchanged lines around each, merged when they overlap. */
export function diffHunks(before: string | null, after: string | null, context = 3): Hunk[] {
  const all = diffAll(before, after);
  const changed = all.map((l, i) => (l.kind === "context" ? -1 : i)).filter((i) => i !== -1);
  if (changed.length === 0) return [];

  const ranges: [number, number][] = [];
  for (const i of changed) {
    const from = Math.max(0, i - context);
    const to = Math.min(all.length - 1, i + context);
    const last = ranges.at(-1);
    if (last && from <= last[1] + 1) last[1] = Math.max(last[1], to);
    else ranges.push([from, to]);
  }

  return ranges.map(([from, to]) => {
    const lines = all.slice(from, to + 1);
    const firstOld = lines.find((l) => l.oldLine !== undefined)?.oldLine;
    const firstNew = lines.find((l) => l.newLine !== undefined)?.newLine;
    const oldLines = lines.filter((l) => l.kind !== "add").length;
    const newLines = lines.filter((l) => l.kind !== "remove").length;
    return {
      // Unified-diff convention: an empty side starts at the line before the hunk.
      oldStart: firstOld ?? (all.slice(0, from).filter((l) => l.kind !== "add").length || 0),
      oldLines,
      newStart: firstNew ?? (all.slice(0, from).filter((l) => l.kind !== "remove").length || 0),
      newLines,
      lines,
    };
  });
}

export function diffStats(change: FileChange): { added: number; removed: number } {
  const all = diffAll(change.before, change.after);
  return {
    added: all.filter((l) => l.kind === "add").length,
    removed: all.filter((l) => l.kind === "remove").length,
  };
}

/** A unified diff as text, the format people paste into reviews. */
export function unifiedDiff(change: FileChange, context = 3): string {
  const header = [
    `--- ${change.before === null ? "/dev/null" : `a/${change.path}`}`,
    `+++ ${change.after === null ? "/dev/null" : `b/${change.path}`}`,
  ];
  const body = diffHunks(change.before, change.after, context).flatMap((h) => [
    `@@ -${h.oldStart},${h.oldLines} +${h.newStart},${h.newLines} @@`,
    ...h.lines.map((l) => `${l.kind === "add" ? "+" : l.kind === "remove" ? "-" : " "}${l.text}`),
  ]);
  return [...header, ...body].join("\n");
}
