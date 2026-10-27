"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DialogHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { lockScroll, openerElement } from "../dialog/modal";
import { filterCommands } from "./filter";
import styles from "./CommandMenu.module.css";

export interface CommandItem {
  id: string;
  label: string;
  /** Commands with the same group are listed together under it, in order of first appearance. */
  group?: string;
  /** Other words that should find it, e.g. "dark" for "Toggle theme". */
  keywords?: string[];
  /** Keys shown beside it, e.g. ["Ctrl", "K"]. Display only: binding them is up to the app. */
  shortcut?: string[];
  disabled?: boolean;
  /** Runs after the menu has closed and focus is back where it was. */
  onSelect: () => void;
}

export interface CommandMenuProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "onSelect"> {
  open: boolean;
  /** Called with `false` on Escape, a backdrop click, or once a command is chosen. */
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  /** Names the dialog and the search field. */
  label?: string;
  placeholder?: string;
  /** Shown when nothing matches. */
  emptyText?: ReactNode;
}

/**
 * A searchable list of commands in a modal: type to filter, arrows to move, Enter to run. Built
 * on `<dialog>` for the top layer, inert background and Escape, with the combobox pattern
 * inside: focus stays in the search field and `aria-activedescendant` points at the current
 * command, so typing and choosing never fight over focus.
 */
export const CommandMenu = forwardRef<HTMLDialogElement, CommandMenuProps>(function CommandMenu(
  {
    open,
    onOpenChange,
    items,
    label = "Commands",
    placeholder = "Search commands…",
    emptyText = "No matching commands",
    className,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const pressedBackdrop = useRef(false);
  const placed = useRef(false);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const base = useId();
  const listId = `${base}-list`;
  // ids are space-separated in ARIA references, so anything unusual in a command id is escaped.
  const optionId = (id: string) => `${base}-option-${id.replace(/[^\w-]/g, "_")}`;

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  // Until someone arrows into the list, the field itself is what's focused for assistive tech,
  // so opening the menu or typing announces the search field, not a command. The best match is
  // still highlighted and still what Enter runs (the APG's list autocomplete with automatic
  // selection).
  const [navigated, setNavigated] = useState(false);
  const results = useMemo(() => filterCommands(items, query), [items, query]);
  const enabled = results.filter((item) => !item.disabled);
  // The active command is always one that can run; when filtering drops it, the first one is.
  const activeId = enabled.some((item) => item.id === active) ? active : (enabled[0]?.id ?? null);

  const groups = useMemo(() => {
    const order: (string | undefined)[] = [];
    const byGroup = new Map<string | undefined, CommandItem[]>();
    for (const item of results) {
      if (!byGroup.has(item.group)) {
        order.push(item.group);
        byGroup.set(item.group, []);
      }
      byGroup.get(item.group)!.push(item);
    }
    return order.map((group) => ({ group, items: byGroup.get(group)! }));
  }, [results]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = openerElement();
      setQuery("");
      setActive(null);
      setNavigated(false);
      placed.current = false;
      pointer.current = null;
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => (open ? lockScroll() : undefined), [open]);
  useEffect(() => () => returnFocus.current?.focus(), []);

  // One highlight that slides to the active command, rather than each row lighting up on its
  // own. It's placed without moving the first time, so it doesn't fly in from the top.
  useLayoutEffect(() => {
    const highlight = highlightRef.current;
    const option = activeId ? document.getElementById(optionId(activeId)) : null;
    if (!highlight) return;
    if (!option) {
      highlight.hidden = true;
      placed.current = false;
      return;
    }
    highlight.hidden = false;
    highlight.toggleAttribute("data-instant", !placed.current);
    highlight.style.setProperty("--y", `${option.offsetTop}px`);
    highlight.style.setProperty("--h", `${option.offsetHeight}px`);
    placed.current = true;
    if (open) option.scrollIntoView({ block: "nearest" });
  });

  const run = (item: CommandItem) => {
    if (item.disabled) return;
    pending.current = item.onSelect;
    onOpenChange(false);
  };

  // Browsers send a pointer move when the list appears or re-filters under a mouse that hasn't
  // moved. Following those would let a resting cursor steal the highlight from the top result
  // while someone types, so only real movement counts.
  const hover = (event: PointerEvent<HTMLDivElement>, item: CommandItem) => {
    const last = pointer.current;
    pointer.current = { x: event.clientX, y: event.clientY };
    if (!last || (last.x === event.clientX && last.y === event.clientY)) return;
    if (!item.disabled && item.id !== activeId) {
      setActive(item.id);
      setNavigated(true);
    }
  };

  const move = (step: 1 | -1) => {
    if (enabled.length === 0) return;
    const index = enabled.findIndex((item) => item.id === activeId);
    const next = enabled[(index + step + enabled.length) % enabled.length];
    if (next) setActive(next.id);
    setNavigated(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = enabled.find((i) => i.id === activeId);
      if (item) run(item);
    }
  };

  const count = enabled.length;

  return (
    <dialog
      ref={dialogRef}
      className={[styles.menu, className].filter(Boolean).join(" ")}
      aria-label={label}
      onCancel={(event) => {
        onCancel?.(event);
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={(event) => {
        onClose?.(event);
        returnFocus.current?.focus();
        returnFocus.current = null;
        const select = pending.current;
        pending.current = null;
        if (open) onOpenChange(false);
        select?.();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        onClick?.(event);
        if (pressedBackdrop.current && event.target === event.currentTarget) onOpenChange(false);
        pressedBackdrop.current = false;
      }}
      {...rest}
    >
      <div className={styles.search}>
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={navigated && activeId ? optionId(activeId) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            // A new query means a new best match: start from the top again, back in the field.
            setActive(null);
            setNavigated(false);
          }}
          onKeyDown={onKeyDown}
        />
        {/* A hint for sighted keyboard users; the dialog role already says Escape closes it. */}
        <kbd className={styles.esc} aria-hidden="true">
          Esc
        </kbd>
      </div>

      <div ref={listRef} className={styles.list} id={listId} role="listbox" aria-label={label}>
        <span ref={highlightRef} className={styles.highlight} aria-hidden="true" hidden />
        {groups.map(({ group, items: groupItems }, groupIndex) => {
          const options = groupItems.map((item) => (
            <div
              key={item.id}
              id={optionId(item.id)}
              className={styles.option}
              role="option"
              aria-selected={item.id === activeId}
              aria-disabled={item.disabled || undefined}
              onPointerMove={(event) => hover(event, item)}
              onClick={() => run(item)}
            >
              <span className={styles.label}>{item.label}</span>
              {item.shortcut && (
                <span className={styles.shortcut}>
                  {item.shortcut.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </span>
              )}
            </div>
          ));
          if (!group) return <div key="ungrouped">{options}</div>;
          const groupId = `${base}-group-${groupIndex}`;
          return (
            <div key={group} role="group" aria-labelledby={groupId}>
              <div id={groupId} className={styles.groupLabel}>
                {group}
              </div>
              {options}
            </div>
          );
        })}
      </div>

      {results.length === 0 && <p className={styles.empty}>{emptyText}</p>}
      {/* Read out how many commands match as the query changes, not on every arrow key. */}
      <p className={styles.visuallyHidden} role="status">
        {query.trim() ? (count === 1 ? "1 command" : `${count} commands`) : ""}
      </p>
    </dialog>
  );
});
