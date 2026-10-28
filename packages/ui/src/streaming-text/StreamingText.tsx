"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { nextChunk, speakable } from "./chunk";
import styles from "./StreamingText.module.css";

export interface StreamingTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Everything received so far. It only grows while streaming; new text replaces it and starts over. */
  text: string;
  /** True while more text is coming. Shows the caret, and decides when the last words are announced. */
  streaming: boolean;
  /**
   * What screen readers hear as it arrives. "sentences" says each finished sentence; "end" says the
   * whole text once it's complete; "off" says nothing, for when something else announces it.
   */
  announce?: "sentences" | "end" | "off";
  /**
   * How long the text can stall mid-sentence, in milliseconds, before the unfinished part is said
   * anyway. A model often pauses before calling a tool, on "Let me check the config".
   */
  pause?: number;
  /** How to draw the text, such as with inline code or links. Plain `text` by default. */
  children?: ReactNode;
}

/** Long enough for a screen reader to have queued the last announcement before it's removed. */
const CLEAR_AFTER_MS = 5000;

/**
 * Text that arrives while it's being read, such as a model's response. Screen readers hear whole
 * sentences, said from a live region separate from the text, rather than the text itself as a live
 * region: that would be re-read or cut off on every token. Text that was already complete when it
 * mounted is not announced, so a conversation's history stays quiet.
 */
export const StreamingText = forwardRef<HTMLDivElement, StreamingTextProps>(function StreamingText(
  { text, streaming, announce = "sentences", pause = 1500, children, className, ...rest },
  ref,
) {
  // Where speech has got to. Starting at the end of complete text keeps history quiet.
  const spoken = useRef(streaming ? 0 : text.length);
  const heardStream = useRef(streaming);
  // Each announcement is a new node, so the same sentence twice in a row is still said.
  const [said, setSaid] = useState<{ n: number; text: string }>({ n: 0, text: "" });

  useEffect(() => {
    if (streaming) heardStream.current = true;
    if (text.length < spoken.current) spoken.current = 0;
    if (announce === "off" || !heardStream.current) return;
    const say = (value: string) => value && setSaid((s) => ({ n: s.n + 1, text: value }));

    if (announce === "end") {
      if (!streaming && spoken.current < text.length) {
        spoken.current = text.length;
        say(speakable(text));
      }
      return;
    }

    const next = (flush: boolean) => {
      const chunk = nextChunk(text, spoken.current, { flush });
      if (!chunk) return;
      spoken.current = chunk.end;
      say(chunk.text);
    };
    if (!streaming) return next(true);
    next(false);
    const stalled = setTimeout(() => next(true), pause);
    return () => clearTimeout(stalled);
  }, [text, streaming, announce, pause]);

  // Once the stream is over, the announcement is taken out, so that reading the page with a
  // screen reader's cursor doesn't find the last sentence twice.
  useEffect(() => {
    if (streaming || !said.text) return;
    const clear = setTimeout(() => setSaid((s) => ({ n: s.n + 1, text: "" })), CLEAR_AFTER_MS);
    return () => clearTimeout(clear);
  }, [streaming, said.text]);

  return (
    <div ref={ref} className={[styles.text, className].filter(Boolean).join(" ")} {...rest}>
      {children ?? text}
      {streaming && <span className={styles.caret} aria-hidden="true" />}
      {/* Present from the first render, since a live region added together with its text is ignored. */}
      <span className={styles.visuallyHidden} aria-live="polite">
        {said.text && <span key={said.n}>{said.text}</span>}
      </span>
    </div>
  );
});
