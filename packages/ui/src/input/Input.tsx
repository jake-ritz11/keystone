import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Field, useFieldIds, type FieldOwnProps } from "../field/Field";
import fieldStyles from "../field/Field.module.css";
import styles from "./Input.module.css";

export interface InputProps
  extends FieldOwnProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  /** Decorative; give meaning through the label, not the icon. */
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

/**
 * A labelled text input. `className` goes on the field wrapper; every other native prop,
 * and the ref, go on the `<input>` itself.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel,
    hint,
    error,
    reserveMessageSpace,
    size = "md",
    iconStart,
    iconEnd,
    id,
    className,
    disabled,
    readOnly,
    required,
    type = "text",
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const { controlId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  const invalid = Boolean(error) || rest["aria-invalid"] === true || rest["aria-invalid"] === "true";

  return (
    <Field
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      reserveMessageSpace={reserveMessageSpace}
      required={required}
      className={className}
    >
      <div
        className={[fieldStyles.control, fieldStyles[size]].join(" ")}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        {iconStart && (
          <span className={fieldStyles.icon} aria-hidden="true">
            {iconStart}
          </span>
        )}
        <input
          ref={ref}
          id={controlId}
          type={type}
          className={[styles.input, styles[size]].join(" ")}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined}
          {...rest}
        />
        {iconEnd && (
          <span className={fieldStyles.icon} aria-hidden="true">
            {iconEnd}
          </span>
        )}
      </div>
    </Field>
  );
});
