"use client";

import { forwardRef, type DetailsHTMLAttributes, type ReactNode } from "react";
import styles from "./Disclosure.module.css";

export interface DisclosureProps extends Omit<DetailsHTMLAttributes<HTMLDetailsElement>, "title" | "onToggle"> {
  /** The always-visible line that opens and closes the content. */
  summary: ReactNode;
  /** Shown at the end of the summary line, e.g. a status Badge. Part of the summary's name. */
  meta?: ReactNode;
  /** Whether it's open, when controlled. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state when the user opens or closes it. */
  onOpenChange?: (open: boolean) => void;
  variant?: "bordered" | "plain";
}

/**
 * Show and hide a section, on the native `<details>`: the keyboard, announcements and
 * find-in-page (closed content is still found, and opens) all come from the browser. Give
 * several the same `name` and only one stays open at a time.
 */
export const Disclosure = forwardRef<HTMLDetailsElement, DisclosureProps>(function Disclosure(
  { summary, meta, open, defaultOpen = false, onOpenChange, variant = "bordered", className, children, ...rest },
  ref,
) {
  return (
    <details
      ref={ref}
      // Uncontrolled, React sets the attribute once and leaves the browser in charge of it.
      open={open ?? defaultOpen}
      onToggle={(event) => {
        if (event.currentTarget.open !== open) onOpenChange?.(event.currentTarget.open);
      }}
      className={[styles.disclosure, styles[variant], className].filter(Boolean).join(" ")}
      {...rest}
    >
      <summary className={styles.summary}>
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m6 4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.label}>{summary}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </summary>
      <div className={styles.content}>{children}</div>
    </details>
  );
});
