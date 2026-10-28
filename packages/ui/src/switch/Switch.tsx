"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Switch.module.css";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "role"> {
  /** Always required: name the setting, not the action ("Email alerts", not "Turn on alerts"). */
  label: ReactNode;
  /** Help under the label, read with the switch. */
  hint?: ReactNode;
  /** Called with the new state. onChange still works too. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * An on/off setting that applies at once. A native checkbox with `role="switch"`, so it's
 * announced as on or off, and Space, the label click and form submission come from the
 * browser. For a choice that's only applied on submit, use Checkbox.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, hint, onCheckedChange, onChange, id, className, disabled, ...rest },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={[styles.switch, className].filter(Boolean).join(" ")} data-disabled={disabled || undefined}>
      <span className={styles.text}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {hint && (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        )}
      </span>
      <span className={styles.track}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          className={styles.input}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.currentTarget.checked);
          }}
          {...rest}
        />
        <span className={styles.thumb} aria-hidden="true" />
      </span>
    </div>
  );
});
