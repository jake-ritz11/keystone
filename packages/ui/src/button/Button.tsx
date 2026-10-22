"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, blocks clicks and sets `aria-busy`, but keeps the button focusable. */
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    iconStart,
    iconEnd,
    disabled,
    className,
    children,
    onClick,
    type = "button",
    ...rest
  },
  ref,
) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      // aria-disabled rather than disabled while loading, so focus isn't lost mid-action.
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : iconStart}
      <span className={styles.label}>{children}</span>
      {!loading && iconEnd}
    </button>
  );
});
