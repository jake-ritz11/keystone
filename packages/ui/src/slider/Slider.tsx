"use client";

import { forwardRef, useId, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Slider.module.css";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "value" | "defaultValue" | "min" | "max" | "step"> {
  /** Always required. Use `hideLabel` when the context already makes it obvious. */
  label: ReactNode;
  hideLabel?: boolean;
  /** Help under the slider, read with it. */
  hint?: ReactNode;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /**
   * How a value is shown and announced: "40%", "3 agents", "2.5 s". Without it the number is
   * shown and read as it is.
   */
  formatValue?: (value: number) => string;
  /** Show the current value next to the label. On by default. */
  showValue?: boolean;
  onValueChange?: (value: number) => void;
}

/**
 * A native range input with a drawn track and thumb. The browser supplies the arrow keys,
 * Home and End, Page Up and Down, pointer dragging and form submission; Keystone draws it and
 * shows the value.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    label,
    hideLabel = false,
    hint,
    value,
    defaultValue,
    min = 0,
    max = 100,
    step = 1,
    formatValue,
    showValue = true,
    onValueChange,
    onChange,
    id,
    className,
    style,
    disabled,
    ...rest
  },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  // Kept even when controlled, so the fill and the shown value follow an uncontrolled slider too.
  const [own, setOwn] = useState(defaultValue ?? min);
  const current = value ?? own;
  const fill = max > min ? ((current - min) / (max - min)) * 100 : 0;
  const text = formatValue ? formatValue(current) : String(current);

  return (
    <div className={[styles.slider, className].filter(Boolean).join(" ")} data-disabled={disabled || undefined}>
      <div className={hideLabel ? styles.headerHidden : styles.header}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {/* Visual only: the input announces its own value, through aria-valuetext when formatted. */}
        {showValue && (
          <span className={styles.value} aria-hidden="true">
            {text}
          </span>
        )}
      </div>
      <input
        ref={ref}
        id={inputId}
        type="range"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={value === undefined ? (defaultValue ?? min) : undefined}
        disabled={disabled}
        aria-valuetext={formatValue ? text : undefined}
        aria-describedby={hintId}
        style={{ ...style, "--fill": `${fill}%` } as CSSProperties}
        onChange={(event) => {
          const next = event.currentTarget.valueAsNumber;
          setOwn(next);
          onChange?.(event);
          onValueChange?.(next);
        }}
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
