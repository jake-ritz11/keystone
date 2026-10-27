"use client";

import type { Action, Item, SessionState, ToolItem } from "@keystone-ui/agent-core";
import { useEffect, useRef, useState } from "react";
import { Disclosure, Shimmer } from "@keystone-ui/ui";
import { isWrite, summarize, describeTool } from "./describe";
import { useSessionLog } from "../study/SessionLog";
import { RichText } from "./RichText";
import { ToolRow } from "./ToolRow";
import styles from "./session.module.css";

type Row = Item | { type: "group"; id: string; items: ToolItem[] };

/**
 * The conversation. The visibility variant changes only what's drawn, never the state:
 * timeline shows every call, narrative folds reads into one line, outcomes shows only edits.
 */
export function Timeline({ state, dispatch }: { state: SessionState; dispatch: (a: Action) => void }) {
  const { visibility, approval } = state.variant;
  const working = state.status === "streaming" || state.status === "ready";
  const rows: Row[] = [];

  for (const item of state.items) {
    const quiet = item.type === "tool" && !isWrite(item) && item.status !== "failed";
    if (visibility === "outcomes" && (quiet || item.type === "progress")) continue;
    if (visibility === "narrative" && item.type === "tool" && quiet) {
      const last = rows.at(-1);
      if (last?.type === "group") last.items.push(item);
      else rows.push({ type: "group", id: `group-${item.id}`, items: [item] });
      continue;
    }
    rows.push(item);
  }

  return (
    <ol className={styles.timeline} aria-label="Conversation">
      {rows.map((row, i) => (
        <li key={row.id} className={styles.entry} data-type={row.type}>
          <Entry row={row} live={working && i === rows.length - 1} approval={approval} dispatch={dispatch} />
        </li>
      ))}
    </ol>
  );
}

/** `live`: this is the newest row and the agent is still working on it. */
function Entry({ row, live, approval, dispatch }: { row: Row; live: boolean; approval: SessionState["variant"]["approval"]; dispatch: (a: Action) => void }) {
  const log = useSessionLog();
  switch (row.type) {
    case "user":
      return <p className={styles.user}>{row.text}</p>;
    case "text":
      return (
        <p className={styles.text}>
          <RichText text={row.text} />
          {row.streaming && <span className={styles.caret} aria-hidden="true" />}
        </p>
      );
    case "progress":
      return <Progress text={row.text} live={live} />;
    case "notice":
      return (
        <p className={styles.notice} data-tone={row.tone}>
          {row.text}
        </p>
      );
    case "group":
      return (
        <Disclosure summary={summarize(row.items)} onOpenChange={(open) => open && log({ kind: "expand", data: { tool: "group", count: row.items.length } })}>
          <ul className={styles.groupList}>
            {row.items.map((item) => (
              <li key={item.id}>{describeTool(item)}</li>
            ))}
          </ul>
        </Disclosure>
      );
    case "tool":
      return <ToolRow item={row} approval={approval} dispatch={dispatch} />;
  }
}

/**
 * A line of the agent's thinking, timed while it's the newest thing happening: "Thinking… 3s",
 * then "4s" once the agent moves on. The time is measured here, for display only; it isn't
 * session state, and a row that was never live shows no time.
 */
function Progress({ text, live }: { text: string; live: boolean }) {
  const started = useRef<number | null>(live ? Date.now() : null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!live || started.current === null) return;
    const tick = () => setSeconds(Math.floor((Date.now() - started.current!) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => {
      clearInterval(timer);
      tick();
    };
  }, [live]);

  return (
    <p className={styles.progress}>
      <Shimmer active={live}>{text || (live ? "Thinking…" : "Thought")}</Shimmer>
      {started.current !== null && (seconds > 0 || !live) && (
        <span className={styles.elapsed}>
          <span className={styles.visuallyHidden}>, </span>
          {live ? `${seconds}s` : `for ${Math.max(seconds, 1)}s`}
        </span>
      )}
    </p>
  );
}
