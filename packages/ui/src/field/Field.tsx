import { useId, type ReactNode } from "react";
import styles from "./Field.module.css";

export type FieldSize = "sm" | "md" | "lg";

/** Props every form control shares: a label, optional help text and an error message. */
export interface FieldOwnProps {
  /** Always required. Use `hideLabel` when the context already makes it obvious. */
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  /** Shown below the control, sets `aria-invalid`, and is announced with the field. */
  error?: ReactNode;
  size?: FieldSize;
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
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
