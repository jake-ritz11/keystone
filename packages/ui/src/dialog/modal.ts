/**
 * What every Keystone modal shares: returning focus to whatever opened it, and locking the page
 * behind it. Used by Dialog and CommandMenu.
 */

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

/**
 * Stops the page behind a modal from scrolling without letting it jump sideways: hiding the
 * scrollbar would widen the page by the scrollbar's width, so the gutter stays reserved while
 * locked. It's only reserved when the page actually had a scrollbar, so short pages don't gain
 * an empty gutter instead. Counted, so stacked dialogs unlock once the last one closes.
 */
let locks = 0;
let saved: { overflow: string; gutter: string } | null = null;

export function lockScroll(): () => void {
  const root = document.documentElement;
  if (locks++ === 0) {
    saved = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    const scrolls = root.scrollHeight > root.clientHeight;
    if (scrolls) root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
  }
  return () => {
    if (--locks > 0 || !saved) return;
    root.style.overflow = saved.overflow;
    root.style.scrollbarGutter = saved.gutter;
    saved = null;
  };
}

export function openerElement(): HTMLElement | null {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const pressed = lastPressed?.isConnected ? lastPressed : null;
  // When the pressed control can't take focus, Safari focuses its nearest focusable ancestor
  // (often <main tabindex="-1">) or <body>. Either way, the control itself is the opener.
  if (pressed && (!active || active === document.body || (active !== pressed && active.contains(pressed)))) {
    return pressed;
  }
  return active && active !== document.body ? active : null;
}
