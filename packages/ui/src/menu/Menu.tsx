"use client";

import {
  cloneElement,
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
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { anchorName, anchorStyle, placeFallback, positionedStyle } from "../popover/anchor";
import styles from "./Menu.module.css";

const ITEM = '[role="menuitem"]:not([aria-disabled="true"])';

const MenuContext = createContext<{ close: () => void } | null>(null);

type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** A single button-like element that forwards its ref, e.g. a Keystone `Button`. */
  trigger: ReactElement<TriggerProps>;
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
  const triggerId = trigger.props.id ?? `${id}-trigger`;
  const anchor = anchorName(id);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const focusOnOpen = useRef<"first" | "last">("first");
  const [open, setOpen] = useState(false);

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? []);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (isOpen) {
        if (triggerRef.current) placeFallback(triggerRef.current, menu, "bottom", "start", 4);
        const list = items();
        (focusOnOpen.current === "last" ? list.at(-1) : list[0])?.focus();
        focusOnOpen.current = "first";
      } else if (menu.contains(document.activeElement) || document.activeElement === document.body) {
        // Escape, or an item was chosen: put focus back where the user started.
        triggerRef.current?.focus();
      }
    };
    menu.addEventListener("toggle", onToggle);
    return () => menu.removeEventListener("toggle", onToggle);
  }, []);

  const close = () => menuRef.current?.hidePopover();

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

  const triggerProps = trigger.props;
  const setTriggerRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    const outer = triggerProps.ref;
    if (typeof outer === "function") outer(node);
    else if (outer) outer.current = node;
  };

  return (
    <MenuContext.Provider value={{ close }}>
      {cloneElement(trigger, {
        ref: setTriggerRef,
        id: triggerId,
        popoverTarget: menuId,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": menuId,
        style: { ...triggerProps.style, ...anchorStyle(anchor) },
        onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
          triggerProps.onKeyDown?.(event);
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          focusOnOpen.current = event.key === "ArrowUp" ? "last" : "first";
          if (open) items()[focusOnOpen.current === "last" ? items().length - 1 : 0]?.focus();
          else menuRef.current?.showPopover();
        },
      })}
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-labelledby={triggerId}
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
  { iconStart, shortcut, tone = "default", disabled, className, children, onClick, ...rest },
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
