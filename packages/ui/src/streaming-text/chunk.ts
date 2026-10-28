/**
 * What a screen reader should say next while text streams in. Announcing every token makes a
 * screen reader either stutter or drop words, so speech moves in whole sentences: everything up
 * to the last finished sentence is said at once, and the unfinished one waits. Kept free of
 * React so the rules can be tested on their own.
 */

export interface Chunk {
  /** What to say, with formatting marks removed. Empty when the next stretch is only marks or space. */
  text: string;
  /** Where the next chunk starts, as an index into the full text. */
  end: number;
}

/** Words whose full stop doesn't end a sentence. Lowercase, without the final dot. */
const ABBREVIATIONS = new Set(["e.g", "i.e", "etc", "vs", "cf", "mr", "mrs", "ms", "dr", "st", "no", "fig", "approx"]);

/**
 * Sentence ends: ., !, ?, … or : followed by a space or the end of a line, with any closing quote or
 * bracket kept with the sentence. A line break always ends one, since lists and code arrive a line
 * at a time.
 */
const BOUNDARY = /[.!?…:]["'”’)\]]*(?=\s)|\n/g;

/** Inside an unclosed `code span`, a full stop is part of the code (a file name, say). */
const inCode = (text: string, index: number) => (text.slice(0, index).match(/`/g)?.length ?? 0) % 2 === 1;

const isAbbreviation = (text: string, dot: number) => {
  const word = /[\p{L}.]+$/u.exec(text.slice(0, dot))?.[0];
  return word !== undefined && ABBREVIATIONS.has(word.toLowerCase());
};

/** Formatting marks a screen reader would read out ("grave", "star star"), and runs of space. */
export const speakable = (text: string) =>
  text
    .replace(/`+/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * The next thing to announce in `text`, starting at `from`, or null when nothing is ready.
 *
 * - While streaming, it returns everything up to the last sentence end, so a burst of tokens that
 *   finishes three sentences is one announcement, not three.
 * - A sentence longer than `max` characters is cut at its last space, so a long run without
 *   punctuation (a list with no full stops, a long path) is not held back for the whole response.
 * - With `flush`, everything left is returned: the stream ended, or paused long enough that
 *   waiting for the end of the sentence would leave the listener with silence.
 */
export function nextChunk(text: string, from: number, { flush = false, max = 240 } = {}): Chunk | null {
  if (from >= text.length) return null;
  if (flush) return { text: speakable(text.slice(from)), end: text.length };

  let end = -1;
  for (const match of text.slice(from).matchAll(BOUNDARY)) {
    const at = from + match.index;
    if (inCode(text, at)) continue;
    if (match[0].startsWith(".") && isAbbreviation(text, at)) continue;
    end = at + match[0].length;
  }

  if (end === -1 && text.length - from > max) {
    const space = text.lastIndexOf(" ", from + max);
    end = space > from ? space + 1 : from + max;
  }
  if (end === -1) return null;
  return { text: speakable(text.slice(from, end)), end };
}
