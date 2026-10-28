import { useId, type ReactNode } from "react";
import styles from "./Field.module.css";

export type FieldSize = "sm" | "md" | "lg";

/** Props every form control shares: a label, optional help text and an error message. */
export interface FieldOwnProps {
  /** Always required. Use `hideLabel` when the context already makes it obvious. */
  label: ReactNode;
  /**
   * Hides the label visually but keeps it for assistive tech.
   * @default false
   */
  hideLabel?: boolean;
  /** Help text below the control, linked with aria-describedby. */
  hint?: ReactNode;
  /** Shown below the control, sets `aria-invalid`, and is announced with the field. */
  error?: ReactNode;
  /**
   * Control height and text size.
   * @default "md"
   */
  size?: FieldSize;
  /**
   * Keep a line under the control for the hint or error even when there's neither, so an error that
   * appears later doesn't push the content below it down. On by default; turn it off for fields
   * that never show a message, like a search box in a toolbar.
   * @default true
   */
  reserveMessageSpace?: boolean;
}

/** Ids that tie the label, hint and error to the control. */
export function useFieldIds(id: string | undefined, hint: ReactNode, error: ReactNode) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, describedBy };
}

interface FieldProps {
  controlId: string;
  hintId?: string;
  errorId?: string;
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  reserveMessageSpace?: boolean;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label, control and messages, stacked. Internal: Input and Select render it. */
export function Field({
  controlId,
  hintId,
  errorId,
  label,
  hideLabel,
  hint,
  error,
  reserveMessageSpace = true,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={controlId} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
        {/* The control's own `required` is what gets announced; the mark is visual. */}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {(hint || error || reserveMessageSpace) && (
        // One slot for both messages: an error takes the hint's place instead of adding a
        // line, so showing, changing or clearing it never moves anything on the page.
        <div className={styles.message}>
          {error && (
            <p id={errorId} className={styles.error}>
              {error}
            </p>
          )}
          {hint && (
            // Hidden, not removed, while there's an error: it's still read with the field.
            <p id={hintId} className={error ? styles.visuallyHidden : styles.hint}>
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
