"use client";

import type { Action, Item, SessionState, ToolItem } from "@keystone-ui/agent-core";
import { Disclosure } from "@keystone-ui/ui";
import { isWrite, summarize, describeTool } from "./describe";
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
      {rows.map((row) => (
        <li key={row.id} className={styles.entry} data-type={row.type}>
          <Entry row={row} approval={approval} dispatch={dispatch} />
        </li>
      ))}
    </ol>
  );
}

function Entry({ row, approval, dispatch }: { row: Row; approval: SessionState["variant"]["approval"]; dispatch: (a: Action) => void }) {
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
      return <p className={styles.progress}>{row.text || "Thinking…"}</p>;
    case "notice":
      return (
        <p className={styles.notice} data-tone={row.tone}>
          {row.text}
        </p>
      );
    case "group":
      return (
        <Disclosure summary={summarize(row.items)}>
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
