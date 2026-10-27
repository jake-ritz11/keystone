"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { flushSync } from "react-dom";
import styles from "./Tabs.module.css";

export type TabsVariant = "underline" | "segmented";

interface TabsContextValue {
  value: string;
  select: (value: string) => void;
  baseId: string;
  activation: "automatic" | "manual";
  orientation: "horizontal" | "vertical";
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`<${component}> must be inside <Tabs>.`);
  return context;
}

const slug = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** Controlled selected tab. */
  value?: string;
  /** Uncontrolled initial tab. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * `automatic` selects a tab as soon as it gets focus, best when panels are cheap to show.
   * `manual` waits for Enter or Space, for panels that load something.
   */
  activation?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  variant?: TabsVariant;
}

/** Tabs following the WAI-ARIA tabs pattern: one tab stop, arrow keys between tabs. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: controlled,
    defaultValue = "",
    onValueChange,
    activation = "automatic",
    orientation = "horizontal",
    variant = "underline",
    className,
    ...rest
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const baseId = useId();
  const select = (next: string) => {
    if (controlled === undefined) setUncontrolled(next);
    if (next !== value) onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value, select, baseId, activation, orientation, variant }}>
      <div
        ref={ref}
        className={[styles.tabs, styles[orientation], className].filter(Boolean).join(" ")}
        {...rest}
      />
    </TabsContext.Provider>
  );
});

export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  /** Name the tab list when the page has more than one, e.g. "Project settings". */
  "aria-label"?: string;
}

export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { className, onKeyDown, ...rest },
  ref,
) {
  const { orientation, variant, activation, select } = useTabs("TabList");
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    // In right-to-left text, the tab "after" this one is to its left.
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const [prev, next] =
      orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : rtl ? ["ArrowRight", "ArrowLeft"] : ["ArrowLeft", "ArrowRight"];
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;

    let target: HTMLButtonElement | undefined;
    if (event.key === next) target = tabs[(current + 1) % tabs.length];
    else if (event.key === prev) target = tabs[(current - 1 + tabs.length) % tabs.length];
    else if (event.key === "Home") target = tabs[0];
    else if (event.key === "End") target = tabs.at(-1);
    if (!target) return;

    event.preventDefault();
    // Select first, then move focus: focus lands on a tab that's already selected, so NVDA
    // announces it once. Focusing first and selecting after made it read the tab twice.
    const value = target.dataset.value;
    if (activation === "automatic" && value) flushSync(() => select(value));
    target.focus();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      className={[styles.list, styles[variant], className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
});

export interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, className, onClick, ...rest },
  ref,
) {
  const tabs = useTabs("Tab");
  const selected = tabs.value === value;
  const id = `${tabs.baseId}-tab-${slug(value)}`;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={id}
      data-value={value}
      aria-selected={selected}
      aria-controls={`${tabs.baseId}-panel-${slug(value)}`}
      // Roving tabindex: only the selected tab is in the page's tab order.
      tabIndex={selected ? 0 : -1}
      className={[styles.tab, className].filter(Boolean).join(" ")}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tabs.select(value);
      }}
      {...rest}
    />
  );
});

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, className, ...rest },
  ref,
) {
  const tabs = useTabs("TabPanel");
  const selected = tabs.value === value;

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${tabs.baseId}-panel-${slug(value)}`}
      aria-labelledby={`${tabs.baseId}-tab-${slug(value)}`}
      hidden={!selected}
      // Focusable so keyboard users can reach panels that have no focusable content.
      tabIndex={0}
      className={[styles.panel, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});
