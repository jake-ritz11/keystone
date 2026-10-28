"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { anchorName, placeFallback, positionedStyle, wireTrigger } from "./anchor";
import styles from "./Popover.module.css";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  /** A single button, such as a Keystone `Button`. It can come from a server component. */
  trigger: ReactNode;
  /** Names the popover, shown as its heading. Always required: it's what's announced on open. */
  title: ReactNode;
  /** Keep the title for screen readers only, when the content makes it obvious. */
  hideTitle?: boolean;
  children: ReactNode;
  /** Which edge of the trigger it lines up with. */
  align?: "start" | "end";
  /** Whether it's showing, when controlled. Pair with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A close button in the corner. On by default; Escape and clicking outside always close it. */
  dismissButton?: boolean;
}

/**
 * Interactive content beside its trigger: a non-modal dialog on the native `popover` attribute.
 * The browser gives it the top layer, light dismiss and Escape. Keystone adds the name, focus
 * into it on open and back to the trigger on close, and anchor positioning. The page stays
 * usable behind it; for something that needs an answer first, use Dialog.
 */
export function Popover({
  trigger,
  title,
  hideTitle = false,
  children,
  align = "start",
  open: controlled,
  onOpenChange,
  dismissButton = true,
  className,
  style,
  onKeyDown,
  ...rest
}: PopoverProps) {
  const id = useId();
  const popoverId = `${id}-popover`;
  const titleId = `${id}-title`;
  const anchor = anchorName(id);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const triggerElement = () => wrapRef.current?.firstElementChild as HTMLElement | null | undefined;

  useEffect(
    () =>
      wireTrigger(wrapRef.current, anchor, {
        popovertarget: popoverId,
        "aria-haspopup": "dialog",
        "aria-controls": popoverId,
      }),
    [anchor, popoverId],
  );

  useEffect(() => {
    triggerElement()?.setAttribute("aria-expanded", String(open));
  }, [open]);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      onOpenChangeRef.current?.(isOpen);
      if (!isOpen) return;
      const trigger = triggerElement();
      if (trigger) placeFallback(trigger, popover, "bottom", align, 4);
      // Into the content: the first control, or the popover itself so its name is read.
      (bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? popover).focus();
    };
    popover.addEventListener("toggle", onToggle);
    return () => popover.removeEventListener("toggle", onToggle);
  }, [align]);

  // Controlled: follow the prop. Closing from here also returns focus, like every other close.
  useEffect(() => {
    const popover = popoverRef.current;
    if (controlled === undefined || !popover) return;
    if (controlled && !popover.matches(":popover-open")) popover.showPopover();
    if (!controlled && popover.matches(":popover-open")) close();
  }, [controlled]);

  /**
   * Closes and returns focus to the trigger explicitly, as Menu does: the browser's own restore
   * isn't reliable in Safari. A click outside doesn't come through here, so it never pulls focus
   * back from where the user clicked.
   */
  function close() {
    const popover = popoverRef.current;
    const hadFocus = popover?.contains(document.activeElement);
    popover?.hidePopover();
    if (hadFocus) triggerElement()?.focus();
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    close();
  };

  return (
    <>
      {/* display: contents, so the trigger lays out as if unwrapped. */}
      <span ref={wrapRef} className={styles.trigger}>
        {trigger}
      </span>
      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[styles.popover, styles[align], className].filter(Boolean).join(" ")}
        style={{ ...positionedStyle(anchor), ...style }}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <div className={hideTitle ? styles.headerHidden : styles.header}>
          <h2 id={titleId} className={hideTitle ? styles.visuallyHidden : styles.title}>
            {title}
          </h2>
          {dismissButton && (
            <button type="button" className={styles.close} aria-label="Close" onClick={close}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div ref={bodyRef} className={styles.body}>
          {children}
        </div>
      </div>
    </>
  );
}
