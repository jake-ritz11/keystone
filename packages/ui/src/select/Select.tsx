import { forwardRef, type SelectHTMLAttributes } from "react";
import { Field, useFieldIds, type FieldOwnProps } from "../field/Field";
import fieldStyles from "../field/Field.module.css";
import styles from "./Select.module.css";

export interface SelectProps
  extends FieldOwnProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "multiple"> {
  /** Adds an empty first option that reads as a prompt; pair it with `required` to force a choice. */
  placeholder?: string;
}

/**
 * A labelled native `<select>`; pass `<option>` and `<optgroup>` children. Native means the
 * keyboard model, mobile pickers and form submission all just work. Where the browser supports
 * `appearance: base-select`, the popup is styled from tokens as well.
 * `className` goes on the field wrapper; every other native prop, and the ref, go on the `<select>`.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hideLabel,
    hint,
    error,
    size = "md",
    placeholder,
    id,
    className,
    disabled,
    required,
    children,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const { controlId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  const invalid = Boolean(error) || rest["aria-invalid"] === true || rest["aria-invalid"] === "true";
  // An uncontrolled select with a placeholder starts on it rather than on the first real option.
  const defaultValue = placeholder && rest.value === undefined && rest.defaultValue === undefined ? "" : rest.defaultValue;

  return (
    <Field
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div
        className={[fieldStyles.control, fieldStyles[size], styles.control].join(" ")}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <select
          ref={ref}
          id={controlId}
          className={[styles.select, styles[size]].join(" ")}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined}
          {...rest}
          defaultValue={defaultValue}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Field>
  );
});
