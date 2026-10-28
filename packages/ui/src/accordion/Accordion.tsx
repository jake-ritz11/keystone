"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "./Accordion.module.css";

interface AccordionState {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  open: (value: string) => void;
  headingLevel: 2 | 3 | 4 | 5 | 6;
}

const AccordionContext = createContext<AccordionState | null>(null);

export interface AccordionProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** Any number open at once. Without it, opening one closes the others. */
  multiple?: boolean;
  /** The open items' values, when controlled. */
  value?: string[];
  /** The items open at first, when uncontrolled. */
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** The heading level each item's title sits in, to fit the page's outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** `AccordionItem` elements. */
  children: ReactNode;
}

/**
 * Sections with a heading each, any of them open. What it adds over a group of Disclosures:
 * the titles are real headings, so screen-reader users can jump between them, and the arrow
 * keys move between them. Closed content is `hidden="until-found"`, so find-in-page still
 * finds it and opens it, as it does with `<details>`.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  { multiple = false, value: controlled, defaultValue = [], onValueChange, headingLevel = 3, className, onKeyDown, children, ...rest },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue);
  const value = controlled ?? uncontrolled;

  const set = (next: string[]) => {
    if (controlled === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };
  const state: AccordionState = {
    isOpen: (item) => value.includes(item),
    toggle: (item) => set(value.includes(item) ? value.filter((v) => v !== item) : multiple ? [...value, item] : [item]),
    open: (item) => {
      if (!value.includes(item)) set(multiple ? [...value, item] : [item]);
    },
    headingLevel,
  };

  // The headers are a list you can arrow through, as in the APG accordion pattern.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const headers = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(`:scope > div > [role="heading"] > button:not(:disabled)`));
    const current = headers.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    let next: number | undefined;
    if (event.key === "ArrowDown") next = (current + 1) % headers.length;
    else if (event.key === "ArrowUp") next = (current - 1 + headers.length) % headers.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = headers.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    headers[next]?.focus();
  };

  return (
    <AccordionContext.Provider value={state}>
      <div ref={ref} className={[styles.accordion, className].filter(Boolean).join(" ")} onKeyDown={handleKeyDown} {...rest}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});

export interface AccordionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Identifies the item in `value`. */
  value: string;
  /** The heading: always visible, and the button that opens and closes the section. */
  title: ReactNode;
  /** Shown at the end of the heading, e.g. a status Badge. Part of the button's name. */
  meta?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(function AccordionItem(
  { value, title, meta, disabled = false, className, children, ...rest },
  ref,
) {
  const accordion = useContext(AccordionContext);
  if (!accordion) throw new Error("AccordionItem must be inside an Accordion.");
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;
  const panelRef = useRef<HTMLDivElement>(null);
  const open = accordion.isOpen(value);
  const openRef = useRef(accordion.open);
  openRef.current = accordion.open;

  // Find-in-page reveals a match in closed content by firing beforematch; open the item then.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onMatch = () => openRef.current(value);
    panel.addEventListener("beforematch", onMatch);
    return () => panel.removeEventListener("beforematch", onMatch);
  }, [value]);

  // React renders hidden="until-found" as plain hidden, so the value is set here, after
  // hydration. Until then closed content isn't searchable, which only matters for a link to a
  // text fragment that's opened before the page hydrates.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (open) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "until-found");
  }, [open]);

  return (
    <div ref={ref} className={[styles.item, className].filter(Boolean).join(" ")} data-open={open || undefined} {...rest}>
      {/* role and aria-level rather than h2–h6, so the level is a prop without a tag switch. */}
      <div role="heading" aria-level={accordion.headingLevel} className={styles.heading}>
        <button
          id={buttonId}
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => accordion.toggle(value)}
        >
          <svg className={styles.chevron} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="m6 4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={styles.title}>{title}</span>
          {meta && <span className={styles.meta}>{meta}</span>}
        </button>
      </div>
      {/* Hidden on the server render too, so closed content never flashes before hydration. */}
      <div ref={panelRef} id={panelId} role="region" aria-labelledby={buttonId} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </div>
  );
});
