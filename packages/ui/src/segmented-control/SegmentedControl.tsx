"use client";

import { forwardRef, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import styles from "./SegmentedControl.module.css";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Names the group for assistive tech, e.g. "Preview width". */
  "aria-label": string;
  options: SegmentedOption<T>[];
  /** The selected value, when controlled. */
  value?: T;
  /** The first selected value, when uncontrolled. */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  size?: "sm" | "md";
}

/**
 * One choice from a few, shown side by side. It's a radio group: one Tab stop, and the arrow keys
 * move and select (mirrored in right-to-left text). Disabled options are skipped but still
 * announced, so people can see what exists.
 */
function SegmentedControlInner<T extends string>(
  { options, value: controlled, defaultValue, onValueChange, size = "md", className, onKeyDown, ...rest }: SegmentedControlProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue ?? options.find((o) => !o.disabled)?.value);
  const value = controlled ?? uncontrolled;
  const buttons = useRef(new Map<T, HTMLButtonElement>());

  const select = (next: T) => {
    if (controlled === undefined) setUncontrolled(next);
    if (next !== value) onValueChange?.(next);
  };

  // The checked option is the Tab stop; with none checked, the first enabled one is.
  const tabStop = options.some((o) => o.value === value && !o.disabled) ? value : options.find((o) => !o.disabled)?.value;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const enabled = options.filter((o) => !o.disabled);
    const current = enabled.findIndex((o) => buttons.current.get(o.value) === document.activeElement);
    if (current === -1) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const back = event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft");
    let target: SegmentedOption<T> | undefined;
    if (forward) target = enabled[(current + 1) % enabled.length];
    else if (back) target = enabled[(current - 1 + enabled.length) % enabled.length];
    else if (event.key === "Home") target = enabled[0];
    else if (event.key === "End") target = enabled.at(-1);
    if (!target) return;
    event.preventDefault();
    buttons.current.get(target.value)?.focus();
    select(target.value);
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      className={[styles.group, styles[size], className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (el) buttons.current.set(option.value, el);
              else buttons.current.delete(option.value);
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            // aria-disabled, not disabled: the option stays announced in place.
            aria-disabled={option.disabled || undefined}
            tabIndex={option.value === tabStop ? 0 : -1}
            className={styles.option}
            onClick={() => !option.disabled && select(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedControl = forwardRef(SegmentedControlInner) as <T extends string>(
  props: SegmentedControlProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof SegmentedControlInner>;
