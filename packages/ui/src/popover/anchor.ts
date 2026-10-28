import type { CSSProperties } from "react";

/**
 * Popovers (Menu, Tooltip, Popover) sit in the top layer and are tied to their trigger with CSS anchor
 * positioning. Browsers without it get a one-shot placement from `placeFallback` on open.
 */

/** A valid `<dashed-ident>` from a React `useId()` value. */
export function anchorName(id: string): string {
  return `--ks-anchor-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

// `positionAnchor` isn't in every csstype release yet.
export const positionedStyle = (name: string) => ({ positionAnchor: name }) as CSSProperties;

/**
 * Popover triggers are wrapped in a `display: contents` span instead of cloned, because an
 * element passed in from a server component can arrive as a lazy reference whose props can't
 * be read. This sets the anchor name and ARIA attributes on the wrapper's first element, merging
 * with any id lists already there, and returns a cleanup that takes them off again.
 */
export function wireTrigger(
  wrapper: HTMLElement | null,
  anchor: string,
  attributes: Record<string, string>,
): (() => void) | undefined {
  const trigger = wrapper?.firstElementChild;
  if (!(trigger instanceof HTMLElement)) return;
  const previous = Object.fromEntries(Object.keys(attributes).map((name) => [name, trigger.getAttribute(name)]));
  for (const [name, value] of Object.entries(attributes)) {
    const merged = name.endsWith("by") ? [previous[name], value].filter(Boolean).join(" ") : value;
    trigger.setAttribute(name, merged);
  }
  trigger.style.setProperty("anchor-name", anchor);
  return () => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === null) trigger.removeAttribute(name);
      else trigger.setAttribute(name, value);
    }
    trigger.style.removeProperty("anchor-name");
  };
}

export function supportsAnchorPositioning(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("anchor-name: --a");
}

/** Places `floating` beside `anchor` in viewport coordinates, flipping when it would overflow. */
export function placeFallback(
  anchor: HTMLElement,
  floating: HTMLElement,
  side: "top" | "bottom",
  align: "start" | "center" | "end",
  gap: number,
): void {
  if (supportsAnchorPositioning()) return;
  const a = anchor.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const fitsBelow = a.bottom + gap + f.height <= window.innerHeight;
  const fitsAbove = a.top - gap - f.height >= 0;
  const below = side === "bottom" ? fitsBelow || !fitsAbove : !fitsAbove && fitsBelow;
  const top = below ? a.bottom + gap : a.top - gap - f.height;
  let left = align === "center" ? a.left + a.width / 2 - f.width / 2 : align === "end" ? a.right - f.width : a.left;
  left = Math.min(Math.max(gap, left), window.innerWidth - f.width - gap);
  floating.style.position = "fixed";
  floating.style.inset = `${top}px auto auto ${left}px`;
  floating.style.margin = "0";
}
