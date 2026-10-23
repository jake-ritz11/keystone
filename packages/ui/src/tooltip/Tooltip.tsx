"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import { anchorName, placeFallback, positionedStyle, wireTrigger } from "../popover/anchor";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  content: ReactNode;
  /** One focusable element, such as a Keystone `Button`. It can come from a server component. */
  children: ReactNode;
  side?: "top" | "bottom";
  /**
   * `description` adds to the trigger's own name (aria-describedby). Use `label` for icon-only
   * buttons, where the tooltip text *is* the name (aria-labelledby).
   */
  kind?: "description" | "label";
  /** Hover delay in ms. Keyboard focus shows it immediately. */
  delay?: number;
}

// Once one tooltip has been shown, moving straight to the next one skips the delay.
let lastHiddenAt = 0;
const SKIP_DELAY_WINDOW = 300;
const HIDE_GRACE = 100;

/**
 * A tooltip on a manual popover, shown on hover and keyboard focus. Per WCAG 1.4.13 it can be
 * dismissed with Escape, it stays open while the pointer is over it, and it never holds
 * anything interactive. Touch input doesn't open it, so don't hide essential information in one.
 */
export function Tooltip({ content, children, side = "top", kind = "description", delay = 500 }: TooltipProps) {
  const id = useId();
  const tooltipId = `${id}-tooltip`;
  const anchor = anchorName(id);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(false);

  const show = (wait: number) => {
    clearTimeout(timer.current);
    const instant = Date.now() - lastHiddenAt < SKIP_DELAY_WINDOW;
    timer.current = setTimeout(() => setOpen(true), instant ? 0 : wait);
  };
  const hide = (wait = 0) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), wait);
  };

  useEffect(
    () =>
      wireTrigger(wrapRef.current, anchor, {
        [kind === "label" ? "aria-labelledby" : "aria-describedby"]: tooltipId,
      }),
    [anchor, kind, tooltipId],
  );

  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    if (open && !tooltip.matches(":popover-open")) {
      tooltip.showPopover();
      const trigger = wrapRef.current?.firstElementChild;
      if (trigger instanceof HTMLElement) placeFallback(trigger, tooltip, side, "center", 8);
    } else if (!open && tooltip.matches(":popover-open")) {
      tooltip.hidePopover();
      lastHiddenAt = Date.now();
    }
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape dismisses only the tooltip. Without this, the same key press would also close a
      // dialog or menu the trigger sits in.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    // Capture phase, so this runs before anything else hears the key.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, side]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <>
      {/* display: contents, so the trigger lays out as if unwrapped; events still bubble here. */}
      <span
        ref={wrapRef}
        className={styles.trigger}
        onPointerEnter={(event: PointerEvent) => {
          if (event.pointerType !== "touch") show(delay);
        }}
        // A short grace period lets the pointer travel onto the tooltip itself.
        onPointerLeave={() => hide(HIDE_GRACE)}
        onFocus={(event: FocusEvent) => {
          if ((event.target as HTMLElement).matches(":focus-visible")) show(0);
        }}
        onBlur={() => hide()}
      >
        {children}
      </span>
      <div
        ref={tooltipRef}
        id={tooltipId}
        popover="manual"
        role="tooltip"
        className={[styles.tooltip, styles[side]].join(" ")}
        style={positionedStyle(anchor)}
        onPointerEnter={() => clearTimeout(timer.current)}
        onPointerLeave={() => hide(HIDE_GRACE)}
      >
        {content}
      </div>
    </>
  );
}
