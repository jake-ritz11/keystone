"use client";

import { forwardRef, useId, useState, type FieldsetHTMLAttributes, type ReactNode } from "react";
import styles from "./RadioGroup.module.css";

export interface RadioOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Help under this option, read with it. */
  hint?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string> extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> {
  /** The question the options answer. Rendered as the fieldset's legend. */
  label: ReactNode;
  /**
   * The answers, in order.
   * @docsType { value, label, hint?, disabled? }[]
   */
  options: RadioOption<T>[];
  /** The selected value, when controlled. */
  value?: T;
  /** The first selected value, when uncontrolled. Leave unset for no answer yet. */
  defaultValue?: T;
  /** Called when the selection changes. */
  onValueChange?: (value: T) => void;
  /**
   * Submitted with a form. Generated when unset, so the radios still group.
   * @default generated
   */
  name?: string;
  /** Help for the whole group, read when focus enters it. */
  hint?: ReactNode;
  /** Shown under the legend, marks every option invalid, and is read when focus enters. */
  error?: ReactNode;
  /**
   * An answer is needed to submit. The browser enforces it.
   * @default false
   */
  required?: boolean;
  /** Stacked, or in a row that wraps. */
  orientation?: "vertical" | "horizontal";
}

/**
 * One answer from a short list, every option visible. Native radios in a fieldset: the browser
 * supplies the single Tab stop, the arrow keys, required validation and form submission. For
 * switching views in place, use SegmentedControl.
 */
function RadioGroupInner<T extends string>(
  {
    label,
    options,
    value: controlled,
    defaultValue,
    onValueChange,
    name,
    hint,
    error,
    required,
    orientation = "vertical",
    disabled,
    className,
    ...rest
  }: RadioGroupProps<T>,
  ref: React.ForwardedRef<HTMLFieldSetElement>,
) {
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue);
  const value = controlled ?? uncontrolled;
  const id = useId();
  const groupName = name ?? id;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      ref={ref}
      className={[styles.group, className].filter(Boolean).join(" ")}
      aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
      disabled={disabled}
      data-orientation={orientation}
      {...rest}
    >
      <legend className={styles.legend}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </legend>
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
      <div className={styles.options}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const optionHint = option.hint ? `${optionId}-hint` : undefined;
          return (
            <div key={option.value} className={styles.option} data-disabled={option.disabled || disabled || undefined}>
              <span className={styles.circle}>
                <input
                  id={optionId}
                  type="radio"
                  name={groupName}
                  value={option.value}
                  className={styles.input}
                  checked={value === undefined ? false : value === option.value}
                  disabled={option.disabled}
                  required={required}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={optionHint}
                  onChange={() => {
                    if (controlled === undefined) setUncontrolled(option.value);
                    onValueChange?.(option.value);
                  }}
                />
              </span>
              <span className={styles.text}>
                <label htmlFor={optionId} className={styles.label}>
                  {option.label}
                </label>
                {option.hint && (
                  <span id={optionHint} className={styles.optionHint}>
                    {option.hint}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export const RadioGroup = forwardRef(RadioGroupInner) as <T extends string>(
  props: RadioGroupProps<T> & { ref?: React.Ref<HTMLFieldSetElement> },
) => ReturnType<typeof RadioGroupInner>;
