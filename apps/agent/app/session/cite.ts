/** A place in the workspace the agent pointed to: a file, and optionally a line or a range. */
export interface Citation {
  path: string;
  line?: number;
  end?: number;
}

export type Segment = { type: "text"; text: string } | { type: "code"; text: string } | { type: "cite"; text: string; cite: Citation };

// A path-like token, with an optional :line or :line-line after it. Paths are what the
// workspace allows: letters, digits, dot, dash, underscore and slashes.
const REFERENCE = /(?<![\w./-])([\w-]+(?:\/[\w-]+)*\.[A-Za-z]+)(?::(\d+)(?:[-–](\d+))?)?(?![\w/-]|\.\w)/g;

/** Splits text into plain runs and references to files that exist in the workspace. */
function cite(text: string, files: ReadonlySet<string>, kind: "text" | "code"): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(REFERENCE)) {
    const [whole, path, line, end] = match;
    // Only files that exist: "abuot.html" in "a typo for about.html" stays plain text.
    if (!files.has(path!)) continue;
    if (match.index > last) out.push({ type: kind, text: text.slice(last, match.index) });
    out.push({
      type: "cite",
      text: whole,
      cite: { path: path!, ...(line && { line: Number(line) }), ...(end && { end: Number(end) }) },
    });
    last = match.index + whole.length;
  }
  if (last < text.length) out.push({ type: kind, text: text.slice(last) });
  return out;
}

/**
 * Model prose as segments: `inline code` as code, and any mention of a workspace file (bare or
 * in backticks, with or without :line) as a citation. Nothing else is interpreted.
 */
export function segments(text: string, files: ReadonlySet<string>): Segment[] {
  return text.split(/(`[^`\n]+`)/g).flatMap((part) => {
    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      const cited = cite(inner, files, "code");
      // A code span that's exactly a reference becomes the link; otherwise it stays code.
      return cited.length === 1 && cited[0]!.type === "cite" ? cited : [{ type: "code" as const, text: inner }];
    }
    return part ? cite(part, files, "text") : [];
  });
}
