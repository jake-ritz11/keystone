"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { anchorName, placeFallback, positionedStyle, wireTrigger } from "../popover/anchor";
import styles from "./Menu.module.css";

const ITEM = '[role="menuitem"]:not([aria-disabled="true"])';

const MenuContext = createContext<{ close: () => void } | null>(null);

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** A single button, such as a Keystone `Button`. It can come from a server component. */
  trigger: ReactNode;
  /** `MenuItem` and `MenuSeparator` elements. */
  children: ReactNode;
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "end";
}

/**
 * An actions menu on the native `popover` attribute: the browser gives it the top layer,
 * light dismiss and Escape, and the trigger's `popovertarget` makes it a real toggle.
 * This component adds the menu keyboard model: arrows, Home/End, typeahead, and focus that
 * returns to the trigger.
 */
export function Menu({ trigger, children, align = "start", className, style, ...rest }: MenuProps) {
  const id = useId();
  const menuId = `${id}-menu`;
  const anchor = anchorName(id);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<"first" | "last">("first");
  const [open, setOpen] = useState(false);

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? []);
  const triggerElement = () => wrapRef.current?.firstElementChild as HTMLElement | null | undefined;

  useEffect(() => {
    const trigger = triggerElement();
    if (!trigger) return;
    if (!trigger.id) trigger.id = `${id}-trigger`;
    menuRef.current?.setAttribute("aria-labelledby", trigger.id);
    return wireTrigger(wrapRef.current, anchor, {
      popovertarget: menuId,
      "aria-haspopup": "menu",
      "aria-controls": menuId,
    });
  }, [anchor, id, menuId]);

  useEffect(() => {
    triggerElement()?.setAttribute("aria-expanded", String(open));
  }, [open]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      const trigger = triggerElement();
      if (isOpen) {
        if (trigger) placeFallback(trigger, menu, "bottom", align, 4);
        const list = items();
        (focusOnOpen.current === "last" ? list.at(-1) : list[0])?.focus();
        focusOnOpen.current = "first";
      }
    };
    menu.addEventListener("toggle", onToggle);
    return () => menu.removeEventListener("toggle", onToggle);
  }, [align]);

  /**
   * Closes from the keyboard or an item choice, then returns focus to the trigger explicitly:
   * the browser's own restore picks whatever had focus before, which in Safari is often <main>
   * or <body>, since clicking a button there doesn't focus it. A light-dismiss click elsewhere
   * doesn't come through here, so it never pulls focus back from where the user clicked.
   */
  const close = () => {
    menuRef.current?.hidePopover();
    triggerElement()?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    focusOnOpen.current = event.key === "ArrowUp" ? "last" : "first";
    if (open) items()[focusOnOpen.current === "last" ? items().length - 1 : 0]?.focus();
    else menuRef.current?.showPopover();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => list[(index + list.length) % list.length]?.focus();

    switch (event.key) {
      case "ArrowDown":
        focusAt(current + 1);
        break;
      case "ArrowUp":
        focusAt(current - 1);
        break;
      case "Home":
        focusAt(0);
        break;
      case "End":
        focusAt(list.length - 1);
        break;
      case "Escape":
      case "Tab":
        close();
        break;
      default: {
        // Typeahead: jump to the next item that starts with the typed character.
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
        const key = event.key.toLowerCase();
        const order = [...list.slice(current + 1), ...list.slice(0, current + 1)];
        order.find((item) => item.textContent?.trim().toLowerCase().startsWith(key))?.focus();
      }
    }
    event.preventDefault();
  };

  return (
    <MenuContext.Provider value={{ close }}>
      {/* display: contents, so the trigger lays out as if unwrapped; its keys still bubble here. */}
      <span ref={wrapRef} className={styles.trigger} onKeyDown={onTriggerKeyDown}>
        {trigger}
      </span>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        // Focusable itself, so moving the pointer off an item can clear the highlight.
        tabIndex={-1}
        className={[styles.menu, styles[align], className].filter(Boolean).join(" ")}
        style={{ ...positionedStyle(anchor), ...style }}
        onKeyDown={onMenuKeyDown}
        {...rest}
      >
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconStart?: ReactNode;
  /** Display-only hint, such as "Ctrl D". Wire the actual shortcut yourself. */
  shortcut?: string;
  tone?: "default" | "danger";
}

/** A menu action. The menu closes after `onClick` unless the handler calls `preventDefault()`. */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  { iconStart, shortcut, tone = "default", disabled, className, children, onClick, onPointerMove, onPointerLeave, ...rest },
  ref,
) {
  const menu = useContext(MenuContext);
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      // aria-disabled keeps the item announced in place; the arrow keys skip it.
      aria-disabled={disabled || undefined}
      className={[styles.item, tone === "danger" && styles.danger, className].filter(Boolean).join(" ")}
      // The pointer moves focus, so hover and keyboard share one highlight instead of two.
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!disabled && document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        const menu = event.currentTarget.closest<HTMLElement>('[role="menu"]');
        if (document.activeElement === event.currentTarget) menu?.focus({ preventScroll: true });
      }}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
        if (!event.defaultPrevented) menu?.close();
      }}
      {...rest}
    >
      {iconStart && (
        <span className={styles.icon} aria-hidden="true">
          {iconStart}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
    </button>
  );
});

export function MenuSeparator(props: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={styles.separator} {...props} />;
}
