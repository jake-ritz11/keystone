"use client";

import { forwardRef, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import styles from "./ToggleGroup.module.css";

export interface ToggleOption<T extends string> {
  value: T;
  /** Always required. With `iconOnly` it's hidden visually and still names the button. */
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ToggleGroupProps<T extends string> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Names the group for assistive tech, e.g. "Text style". */
  "aria-label": string;
  /**
   * The buttons, in order.
   * @docsType { value, label, icon?, disabled? }[]
   */
  options: ToggleOption<T>[];
  /** Any number pressed at once, or at most one. */
  multiple?: boolean;
  /** The pressed values, when controlled. */
  value?: T[];
  /** The values pressed at first, when uncontrolled. */
  defaultValue?: T[];
  /** Called with every pressed value after a change. */
  onValueChange?: (value: T[]) => void;
  /** Show only the icons. Each label still names its button. */
  iconOnly?: boolean;
  /** Padding around each button. */
  size?: "sm" | "md";
}

/**
 * Buttons that stay pressed, side by side: formatting, filters, view options. Each is a native
 * button with `aria-pressed`. Unlike SegmentedControl, nothing has to be pressed, and with
 * `multiple` any number can be. One Tab stop; the arrow keys move between buttons and Space or
 * Enter presses one.
 */
function ToggleGroupInner<T extends string>(
  {
    options,
    multiple = false,
    value: controlled,
    defaultValue = [],
    onValueChange,
    iconOnly = false,
    size = "md",
    className,
    onKeyDown,
    ...rest
  }: ToggleGroupProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [uncontrolled, setUncontrolled] = useState<T[]>(defaultValue);
  const value = controlled ?? uncontrolled;
  const [lastFocused, setLastFocused] = useState<T | undefined>();
  const buttons = useRef(new Map<T, HTMLButtonElement>());

  const toggle = (item: T) => {
    const pressed = value.includes(item);
    // Kept in the options' order, whatever order they were pressed in.
    const next = multiple
      ? options.map((o) => o.value).filter((v) => (v === item ? !pressed : value.includes(v)))
      : pressed
        ? []
        : [item];
    if (controlled === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  // The Tab stop is where focus last was, else the first pressed button, else the first enabled.
  const enabled = options.filter((o) => !o.disabled);
  const tabStop =
    enabled.find((o) => o.value === lastFocused)?.value ??
    enabled.find((o) => value.includes(o.value))?.value ??
    enabled[0]?.value;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const current = enabled.findIndex((o) => buttons.current.get(o.value) === document.activeElement);
    if (current === -1) return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = event.key === "ArrowDown" || event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const back = event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft");
    let target: ToggleOption<T> | undefined;
    if (forward) target = enabled[(current + 1) % enabled.length];
    else if (back) target = enabled[(current - 1 + enabled.length) % enabled.length];
    else if (event.key === "Home") target = enabled[0];
    else if (event.key === "End") target = enabled.at(-1);
    if (!target) return;
    event.preventDefault();
    // Moving doesn't press: these are independent settings, not one choice.
    buttons.current.get(target.value)?.focus();
  };

  return (
    <div
      ref={ref}
      role="group"
      className={[styles.group, styles[size], iconOnly && styles.iconOnly, className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {options.map((option) => (
        <button
          key={option.value}
          ref={(el) => {
            if (el) buttons.current.set(option.value, el);
            else buttons.current.delete(option.value);
          }}
          type="button"
          aria-pressed={value.includes(option.value)}
          // aria-disabled, not disabled: the button stays announced in place.
          aria-disabled={option.disabled || undefined}
          tabIndex={option.value === tabStop ? 0 : -1}
          className={styles.item}
          onFocus={() => setLastFocused(option.value)}
          onClick={() => !option.disabled && toggle(option.value)}
        >
          {option.icon && <span className={styles.icon}>{option.icon}</span>}
          <span className={iconOnly ? styles.visuallyHidden : undefined}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export const ToggleGroup = forwardRef(ToggleGroupInner) as <T extends string>(
  props: ToggleGroupProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof ToggleGroupInner>;
