"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Always required: it's what a click on the text toggles, and what's announced. */
  label: ReactNode;
  /** Help under the label, read with the checkbox. */
  hint?: ReactNode;
  /** Shown under the label, sets `aria-invalid`, and is read with the checkbox. */
  error?: ReactNode;
  /** Mixed: some of a group is checked. Shown as a dash and announced as "mixed". */
  indeterminate?: boolean;
  /** Called with the new state. onChange still works too. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * A native checkbox with a drawn box. The browser supplies the label click, Space, form
 * submission and validation; Keystone draws the box, the check and the mixed state.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, error, indeterminate = false, onCheckedChange, onChange, id, className, disabled, ...rest },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current as HTMLInputElement);
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  // `indeterminate` is a DOM property with no attribute, so it's set after render.
  useEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={[styles.checkbox, className].filter(Boolean).join(" ")} data-disabled={disabled || undefined}>
      <span className={styles.box}>
        <input
          ref={input}
          id={inputId}
          type="checkbox"
          className={styles.input}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.currentTarget.checked);
          }}
          {...rest}
        />
        <svg className={styles.mark} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path className={styles.check} d="M3.5 8.5l3 3 6-7" pathLength={1} />
          <path className={styles.dash} d="M4 8h8" />
        </svg>
      </span>
      <span className={styles.text}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {error && (
          <span id={errorId} className={styles.error}>
            {error}
          </span>
        )}
        {hint && (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        )}
      </span>
    </div>
  );
});
