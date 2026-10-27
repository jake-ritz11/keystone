/** What filtering needs from a command. */
export interface Searchable {
  label: string;
  keywords?: string[];
}

/**
 * The commands that match `query`, best first. Every word typed has to appear somewhere in the
 * label or keywords. Labels that start with the query rank first, then labels with a word that
 * starts with it, then everything else; ties keep their original order, so groups stay stable.
 */
export function filterCommands<T extends Searchable>(items: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  const words = q.split(/\s+/);

  const scored: { item: T; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const label = item.label.toLowerCase();
    const haystack = [label, ...(item.keywords ?? []).map((k) => k.toLowerCase())].join(" ");
    if (!words.every((word) => haystack.includes(word))) return;
    const score = label.startsWith(q) ? 0 : label.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 2;
    scored.push({ item, score, index });
  });
  return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((s) => s.item);
}
