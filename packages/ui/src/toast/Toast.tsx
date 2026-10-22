"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../button/Button";
import styles from "./Toast.module.css";

export type ToastTone = "neutral" | "success" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  /** `danger` is announced assertively; the others politely. */
  tone?: ToastTone;
  /**
   * One optional action, such as "Undo". Toasts time out, so the same action must also be
   * reachable somewhere else in the interface.
   */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it dismisses itself. `Infinity` keeps it until closed. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  leaving: boolean;
}

interface ToastApi {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Shows a toast and returns its id. Must be used inside `<ToastProvider>`. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast() must be used inside <ToastProvider>.");
  return api;
}

const EXIT_MS = 200;
let counter = 0;

export interface ToastProviderProps {
  children: ReactNode;
  /** Default time on screen, in ms. */
  duration?: number;
}

/** The modal dialog the user is in, if any. Everything outside it is inert. */
const openModal = () =>
  typeof document === "undefined" ? null : Array.from(document.querySelectorAll<HTMLDialogElement>("dialog:modal")).at(-1) ?? null;

/**
 * Hosts the toast stack. Toasts render in a manual popover, so they sit above an open modal
 * dialog too; while a modal is open the layer is portalled into it, because a modal makes the
 * rest of the document inert, and a toast you can see but not click (or hear) is worse than
 * none. Announcements go through live regions that are already in the page, since screen
 * readers ignore a live region that appears at the same moment as its text.
 * Timers pause while the pointer or focus is on the stack (WCAG 2.2.1).
 */
export function ToastProvider({ children, duration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState({ polite: "", assertive: "" });
  const regionRef = useRef<HTMLElement>(null);
  const [container, setContainer] = useState<HTMLDialogElement | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `ks-toast-${++counter}`;
      setContainer(openModal());
      setToasts((all) => [...all, { duration, ...options, id, leaving: false }]);
      const text = [options.title, options.description].filter(Boolean).join(". ");
      const channel = options.tone === "danger" ? "assertive" : "polite";
      // Clear first so the same message twice in a row is still announced, and give a freshly
      // moved layer a moment to be in the accessibility tree before the text lands.
      setAnnouncement({ polite: "", assertive: "" });
      setTimeout(() => setAnnouncement((a) => ({ ...a, [channel]: text })), 100);
      return id;
    },
    [duration],
  );

  // When the modal holding the layer closes, move back out (or into the next modal down).
  useEffect(() => {
    if (!container) return;
    const onClose = () => setContainer(openModal());
    container.addEventListener("close", onClose);
    return () => container.removeEventListener("close", onClose);
  }, [container]);

  const count = toasts.length;
  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const isOpen = region.matches(":popover-open");
    if (count === 0) {
      if (isOpen) region.hidePopover();
      setPaused(false);
      return;
    }
    // Re-showing moves the stack to the top of the top layer, above a dialog opened since.
    if (isOpen) region.hidePopover();
    region.showPopover();
  }, [count, container]);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  const layer = (
    <>
      <div className={styles.visuallyHidden} role="status" aria-live="polite">
        {announcement.polite}
      </div>
      <div className={styles.visuallyHidden} role="alert" aria-live="assertive">
        {announcement.assertive}
      </div>
      <section
        ref={regionRef}
        popover="manual"
        aria-label="Notifications"
        className={styles.region}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
      >
        <ol className={styles.list}>
          {toasts.map((item) => (
            <ToastView key={item.id} item={item} paused={paused} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
    </>
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {container ? createPortal(layer, container) : layer}
    </ToastContext.Provider>
  );
}

const ICONS: Record<ToastTone, string> = {
  neutral: "M8 7v4M8 5h.01",
  success: "m5 8 2 2 4-4",
  danger: "M8 5v3.5M8 11h.01",
};

function ToastView({
  item,
  paused,
  onDismiss,
}: {
  item: ToastItem;
  paused: boolean;
  onDismiss: (id: string) => void;
}) {
  const { id, title, description, tone = "neutral", action, duration = Infinity, leaving } = item;
  const remaining = useRef(duration);

  useEffect(() => {
    if (paused || leaving || !Number.isFinite(remaining.current)) return;
    const started = Date.now();
    const timer = setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, leaving, id, onDismiss]);

  return (
    <li className={[styles.toast, styles[tone]].join(" ")} data-leaving={leaving || undefined}>
      <span className={styles.icon} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6.25" />
          <path d={ICONS[tone]} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
        >
          {action.label}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className={styles.close}
        aria-label={`Dismiss: ${title}`}
        onClick={() => onDismiss(id)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </Button>
    </li>
  );
}
