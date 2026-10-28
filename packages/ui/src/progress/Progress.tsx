import { forwardRef, useId, type ProgressHTMLAttributes, type ReactNode } from "react";
import styles from "./Progress.module.css";

export interface ProgressProps extends Omit<ProgressHTMLAttributes<HTMLProgressElement>, "value" | "max"> {
  /** Always required: what's in progress ("Uploading report.pdf"). */
  label: ReactNode;
  /** Hides the label visually; it's still announced. */
  hideLabel?: boolean;
  /** Help under the bar, read with it: what's left, or what happens next. */
  hint?: ReactNode;
  /** How far along, from 0 to `max`. Leave it out while the amount is unknown. */
  value?: number;
  /** The value at completion. */
  max?: number;
  /**
   * How the value is shown and announced: "3 of 12 files", "1.2 of 4 MB". Without it, a
   * percentage.
   */
  formatValue?: (value: number, max: number) => string;
  /** Show the value next to the label. On by default; there's nothing to show while indeterminate. */
  showValue?: boolean;
}

/**
 * A native progress bar, drawn with tokens. With a value it's announced as a percentage (or
 * `formatValue`'s text); without one it's indeterminate and moves to show work is happening.
 * It doesn't announce updates by itself: say when the work finishes, with a toast or a status.
 */
export const Progress = forwardRef<HTMLProgressElement, ProgressProps>(function Progress(
  { label, hideLabel = false, hint, value, max = 100, formatValue, showValue = true, id, className, ...rest },
  ref,
) {
  const generated = useId();
  const barId = id ?? generated;
  const hintId = hint ? `${barId}-hint` : undefined;
  const determinate = value !== undefined;
  const clamped = determinate ? Math.min(Math.max(value, 0), max) : 0;
  const text = formatValue ? formatValue(clamped, max) : `${Math.round((clamped / max) * 100)}%`;

  return (
    <div className={[styles.progress, className].filter(Boolean).join(" ")}>
      <div className={hideLabel ? styles.headerHidden : styles.header}>
        <label htmlFor={barId} className={styles.label}>
          {label}
        </label>
        {/* Visual only: the bar announces its own value. */}
        {showValue && determinate && (
          <span className={styles.value} aria-hidden="true">
            {text}
          </span>
        )}
      </div>
      <progress
        ref={ref}
        id={barId}
        className={styles.bar}
        max={max}
        value={determinate ? clamped : undefined}
        aria-valuetext={determinate && formatValue ? text : undefined}
        aria-describedby={hintId}
        {...rest}
      />
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
});
