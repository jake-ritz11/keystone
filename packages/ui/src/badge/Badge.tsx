import { forwardRef, type HTMLAttributes } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** A leading dot, for statuses. The text still has to carry the meaning on its own. */
  dot?: boolean;
}

/** A short, static label for a status or category. Not interactive; use Button for actions. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = "neutral", dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
});
