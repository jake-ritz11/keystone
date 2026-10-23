"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type DialogHTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "../button/Button";
import styles from "./Dialog.module.css";

export type DialogSize = "sm" | "md" | "lg";

// Safari doesn't focus a button when it's clicked, so on open `document.activeElement` is often
// <body>. Remember the last control pressed so focus can still go back to whatever opened the
// dialog.
let lastPressed: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      lastPressed = target?.closest<HTMLElement>("button, a[href], input, select, textarea, [tabindex]") ?? null;
    },
    true,
  );
}

function openerElement(): HTMLElement | null {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const pressed = lastPressed?.isConnected ? lastPressed : null;
  // When the pressed control can't take focus, Safari focuses its nearest focusable ancestor
  // (often <main tabindex="-1">) or <body>. Either way, the control itself is the opener.
  if (pressed && (!active || active === document.body || (active !== pressed && active.contains(pressed)))) {
    return pressed;
  }
  return active && active !== document.body ? active : null;
}

export interface DialogProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "title"> {
  open: boolean;
  /** Called with `false` on Escape, the close button, or a backdrop click (when `dismissible`). */
  onOpenChange: (open: boolean) => void;
  /** Names the dialog for assistive tech. Required: every dialog needs an accessible name. */
  title: ReactNode;
  description?: ReactNode;
  /** Usually the actions. Rendered in a bar below the scrollable body. */
  footer?: ReactNode;
  size?: DialogSize;
  /** Close on a backdrop click. Turn off for dialogs that hold unsaved input. */
  dismissible?: boolean;
  /** Hide the corner close button, e.g. when the footer already has a cancel action. */
  hideCloseButton?: boolean;
}

/**
 * A modal built on the native `<dialog>` and `showModal()`, so the browser supplies the top
 * layer, the inert background, the focus trap and Escape. React stays the source of truth:
 * every close request goes through `onOpenChange`, and `open` drives the element.
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {
    open,
    onOpenChange,
    title,
    description,
    footer,
    size = "md",
    dismissible = true,
    hideCloseButton = false,
    className,
    children,
    onCancel,
    onClose,
    onPointerDown,
    onClick,
    ...rest
  },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useImperativeHandle(ref, () => dialogRef.current as HTMLDialogElement);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pressedBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = openerElement();
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // If the dialog unmounts while open, still hand focus back.
  useEffect(() => () => returnFocus.current?.focus(), []);

  const classes = [styles.dialog, size !== "md" && styles[size], className].filter(Boolean).join(" ");

  return (
    <dialog
      ref={dialogRef}
      className={classes}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        onCancel?.(event);
        // Escape: let React decide, rather than the element closing itself.
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={(event) => {
        onClose?.(event);
        returnFocus.current?.focus();
        returnFocus.current = null;
        // Closed some other way (e.g. a form with method="dialog"); sync the state.
        if (open) onOpenChange(false);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        onClick?.(event);
        // The panel fills the element, so a click that lands on the <dialog> itself is on the
        // backdrop. Requiring the press to start there too ignores drags out of a text field.
        if (dismissible && pressedBackdrop.current && event.target === event.currentTarget) {
          onOpenChange(false);
        }
        pressedBackdrop.current = false;
      }}
      {...rest}
    >
      <div className={styles.header}>
        <div className={styles.heading}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className={styles.description}>
              {description}
            </p>
          )}
        </div>
        {!hideCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            className={styles.close}
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </Button>
        )}
      </div>
      {children && <div className={styles.body}>{children}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </dialog>
  );
});
