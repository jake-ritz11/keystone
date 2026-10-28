import { forwardRef, type HTMLAttributes } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color. The text still has to carry the meaning. */
  tone?: BadgeTone;
  /** A leading dot, for statuses. The text still has to carry the meaning on its own. */
  dot?: boolean;
  /** The dot breathes, for a status that's still in progress ("Writing"). Still with reduced motion. */
  pulse?: boolean;
}

/** A short, static label for a status or category. Not interactive; use Button for actions. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = "neutral", dot = false, pulse = false, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")} {...rest}>
      {dot && <span className={styles.dot} data-pulse={pulse || undefined} aria-hidden="true" />}
      {children}
    </span>
  );
});
