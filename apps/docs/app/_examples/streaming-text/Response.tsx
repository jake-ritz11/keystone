"use client";

import { useEffect, useRef, useState } from "react";
import { Button, SegmentedControl, StreamingText, type StreamingTextProps } from "@keystone-ui/ui";

const RESPONSE =
  "I found the problem in `pagination.ts`. The loop starts at 1, so the first page is skipped. " +
  "Checking what else calls `firstPage`" +
  "\u0000" +
  "\n\nNothing else does. I changed the start to 0 and added a test for the first page. All 14 tests pass.";

/** The response as a model sends it: a few characters at a time, unevenly, with one long pause. */
function tokens(text: string) {
  const out: { text: string; wait: number }[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\u0000") {
      out.push({ text: "", wait: 2600 });
      i++;
      continue;
    }
    const size = 2 + ((i * 7) % 5);
    const piece = text.slice(i, i + size).split("\u0000")[0]!;
    out.push({ text: piece, wait: 35 + ((i * 13) % 50) });
    i += piece.length;
  }
  return out;
}

/** The component's modes, plus the usual approach, a live region on the text itself, to compare against. */
type Mode = NonNullable<StreamingTextProps["announce"]> | "text";

export function Response() {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<Mode>("sentences");
  const [heard, setHeard] = useState<string[]>([]);
  const [updates, setUpdates] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The transcript below is read from the live region itself, so it shows exactly what a screen
  // reader is given, not what this example meant to give it. Changes to the visible text are
  // counted too, for the comparison.
  useEffect(() => {
    const element = root.current;
    const region = element?.querySelector("[aria-live]");
    if (!element || !region) return;
    const observer = new MutationObserver((records) => {
      if (records.some((r) => !region.contains(r.target))) setUpdates((n) => n + 1);
      if (!records.some((r) => region.contains(r.target))) return;
      const said = region.textContent?.trim();
      if (said) setHeard((h) => [...h, said]);
    });
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    clearTimeout(timer.current);
    setText("");
    setHeard([]);
    setUpdates(0);
    setStreaming(true);
    const queue = tokens(RESPONSE);
    let i = 0;
    const step = () => {
      const token = queue[i++];
      if (!token) return setStreaming(false);
      setText((t) => t + token.text);
      timer.current = setTimeout(step, token.wait);
    };
    step();
  };

  const stop = () => {
    clearTimeout(timer.current);
    setStreaming(false);
  };

  return (
    <div className="stack">
      <div className="row">
        {/* One button whose label changes, so focus stays on it when the stream starts and stops. */}
        <Button variant={streaming ? "secondary" : "primary"} onClick={streaming ? stop : start}>
          {streaming ? "Stop" : text ? "Play again" : "Play response"}
        </Button>
        <SegmentedControl<Mode>
          aria-label="Announce"
          size="sm"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "sentences", label: "Sentences" },
            { value: "end", label: "At the end" },
            { value: "off", label: "Off" },
            { value: "text", label: "Live text" },
          ]}
        />
      </div>
      <StreamingText
        ref={root}
        className="streaming-demo"
        text={text}
        streaming={streaming}
        announce={mode === "text" ? "off" : mode}
        aria-live={mode === "text" ? "polite" : undefined}
      >
        {text ? undefined : <span className="note">Nothing yet. Play the response to start the stream.</span>}
      </StreamingText>
      <section className="heard">
        <h3>What a screen reader is given</h3>
        {mode === "text" ? (
          <p className="note">
            The whole text is a live region, so each of its {updates} changes so far is given to the screen reader, and the screen
            reader decides what to make of a sentence that is half there.
          </p>
        ) : heard.length === 0 ? (
          <p className="note">Nothing announced yet.</p>
        ) : (
          <ol>
            {heard.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
