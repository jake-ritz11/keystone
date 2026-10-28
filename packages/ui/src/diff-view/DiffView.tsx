import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import styles from "./DiffView.module.css";

export interface DiffViewLine {
  kind: "context" | "add" | "remove";
  text: string;
  oldLine?: number;
  newLine?: number;
}

export interface DiffViewHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffViewLine[];
}

export interface DiffViewProps extends HTMLAttributes<HTMLElement> {
  /** The file the change is to. Also names the region for assistive tech. */
  path: string;
  /** Changed regions, each with its lines and their numbers on both sides. */
  hunks: DiffViewHunk[];
  /** Header content after the path and counts, e.g. Approve and Reject buttons. */
  actions?: ReactNode;
}

const SPOKEN: Record<DiffViewLine["kind"], string> = { add: "Added: ", remove: "Removed: ", context: "" };
const SIGN: Record<DiffViewLine["kind"], string> = { add: "+", remove: "−", context: " " };

function range(start: number, count: number): string {
  if (count === 0) return "none";
  return count === 1 ? `line ${start}` : `lines ${start}–${start + count - 1}`;
}

/**
 * A unified diff. It's a real table, and every changed line says "Added" or "Removed" to
 * screen readers, so color is never the only signal. Line numbers and +/− marks can't be
 * selected, so copying a change copies only the code.
 */
export const DiffView = forwardRef<HTMLElement, DiffViewProps>(function DiffView(
  { path, hunks, actions, className, ...rest },
  ref,
) {
  const headingId = useId();
  const lines = hunks.flatMap((h) => h.lines);
  const added = lines.filter((l) => l.kind === "add").length;
  const removed = lines.filter((l) => l.kind === "remove").length;

  return (
    <section ref={ref} aria-labelledby={headingId} className={[styles.diff, className].filter(Boolean).join(" ")} {...rest}>
      <div className={styles.header}>
        <span id={headingId} className={styles.path}>
          {path}
        </span>
        <span className={styles.stats}>
          <span className={styles.statAdded}>
            +{added}
            <span className={styles.visuallyHidden}> lines added,</span>
          </span>
          <span className={styles.statRemoved}>
            −{removed}
            <span className={styles.visuallyHidden}> lines removed</span>
          </span>
        </span>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {hunks.length === 0 ? (
        <p className={styles.empty}>No changes.</p>
      ) : (
        // Focusable and named so keyboard users can scroll long lines sideways.
        <div className={styles.scroll} role="region" aria-label={`Diff of ${path}`} tabIndex={0}>
          <table className={styles.table}>
            {hunks.map((hunk, h) => (
              <tbody key={h}>
                <tr className={styles.hunk}>
                  <th colSpan={4} scope="colgroup">
                    {hunk.newLines > 0 ? `Changes at ${range(hunk.newStart, hunk.newLines)}` : `Removed ${range(hunk.oldStart, hunk.oldLines)}`}
                  </th>
                </tr>
                {hunk.lines.map((line, i) => (
                  <tr key={i} className={styles.row} data-kind={line.kind}>
                    <td className={styles.num} aria-hidden="true">
                      {line.oldLine ?? ""}
                    </td>
                    <td className={styles.num} aria-hidden="true">
                      {line.newLine ?? ""}
                    </td>
                    <td className={styles.sign} aria-hidden="true">
                      {SIGN[line.kind]}
                    </td>
                    <td className={styles.code}>
                      {SPOKEN[line.kind] && <span className={styles.visuallyHidden}>{SPOKEN[line.kind]}</span>}
                      {line.text === "" ? "​" : line.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </section>
  );
});
