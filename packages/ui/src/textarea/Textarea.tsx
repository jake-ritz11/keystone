import { forwardRef, type CSSProperties, type TextareaHTMLAttributes } from "react";
import { Field, useFieldIds, type FieldOwnProps } from "../field/Field";
import fieldStyles from "../field/Field.module.css";
import styles from "./Textarea.module.css";

export interface TextareaProps extends FieldOwnProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow with the text, from `minRows` up to `maxRows`, then scroll. */
  autoResize?: boolean;
  /** Height when empty, in lines. */
  minRows?: number;
  /** Tallest it grows before scrolling, in lines. */
  maxRows?: number;
}

/**
 * A labelled multi-line text field. Shares Input's field shell: the same label, hint, error and
 * focus treatment. `className` goes on the field wrapper; every other native prop, and the ref,
 * go on the `<textarea>`.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hideLabel,
    hint,
    error,
    reserveMessageSpace,
    size = "md",
    autoResize = true,
    minRows = 3,
    maxRows = 12,
    id,
    className,
    style,
    disabled,
    readOnly,
    required,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const { controlId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  const invalid = Boolean(error) || rest["aria-invalid"] === true || rest["aria-invalid"] === "true";
  const rows = { "--ks-textarea-min-rows": minRows, "--ks-textarea-max-rows": maxRows } as CSSProperties;

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
        className={[fieldStyles.control, fieldStyles[size], styles.control].join(" ")}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        <textarea
          ref={ref}
          id={controlId}
          rows={minRows}
          className={[styles.textarea, styles[size], autoResize && styles.auto].filter(Boolean).join(" ")}
          style={{ ...rows, ...style }}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined}
          {...rest}
        />
      </div>
    </Field>
  );
});
