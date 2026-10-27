import { forwardRef, type HTMLAttributes } from "react";
import styles from "./Shimmer.module.css";

export interface ShimmerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Sweeps while true; plain text in the surrounding color when false, so the words can stay once the work ends. */
  active?: boolean;
}

/**
 * Text that a light sweeps across while something is in progress: "Thinking…", "Reading
 * index.html". The words carry the meaning; the sweep only says they're current. Screen readers
 * get the text as-is, and reduced motion gets it still.
 */
export const Shimmer = forwardRef<HTMLSpanElement, ShimmerProps>(function Shimmer(
  { active = true, className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={[styles.shimmer, className].filter(Boolean).join(" ")} data-active={active || undefined} {...rest}>
      {children}
    </span>
  );
});
