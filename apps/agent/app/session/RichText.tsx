"use client";

import { createContext, Fragment, useContext } from "react";
import { segments, type Citation } from "./cite";
import styles from "./session.module.css";

/** The workspace's files, and how to show one: what turns a file mention into a link. */
export const CiteContext = createContext<{ files: ReadonlySet<string>; open: (cite: Citation) => void } | null>(null);

/**
 * Model prose with `inline code` rendered as code, and mentions of workspace files as buttons
 * that open the file at the cited line, so a claim about the code can be checked in one step.
 * Nothing else is interpreted.
 */
export function RichText({ text }: { text: string }) {
  const context = useContext(CiteContext);
  return (
    <>
      {segments(text, context?.files ?? new Set()).map((part, i) => {
        if (part.type === "code") return <code key={i}>{part.text}</code>;
        if (part.type === "cite" && context) {
          return (
            <button key={i} type="button" className={styles.cite} onClick={() => context.open(part.cite)}>
              {part.text}
            </button>
          );
        }
        return <Fragment key={i}>{part.text}</Fragment>;
      })}
    </>
  );
}
