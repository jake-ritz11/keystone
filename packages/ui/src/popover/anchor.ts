import type { CSSProperties } from "react";

/**
 * Popovers (Menu, Tooltip) sit in the top layer and are tied to their trigger with CSS anchor
 * positioning. Browsers without it get a one-shot placement from `placeFallback` on open.
 */

/** A valid `<dashed-ident>` from a React `useId()` value. */
export function anchorName(id: string): string {
  return `--ks-anchor-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

// `anchorName` and `positionAnchor` aren't in every csstype release yet, so they go in as strings.
export const anchorStyle = (name: string) => ({ anchorName: name }) as CSSProperties;
export const positionedStyle = (name: string) => ({ positionAnchor: name }) as CSSProperties;

export function supportsAnchorPositioning(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("anchor-name: --a");
}

/** Places `floating` beside `anchor` in viewport coordinates, flipping when it would overflow. */
export function placeFallback(
  anchor: HTMLElement,
  floating: HTMLElement,
  side: "top" | "bottom",
  align: "start" | "center",
  gap: number,
): void {
  if (supportsAnchorPositioning()) return;
  const a = anchor.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const fitsBelow = a.bottom + gap + f.height <= window.innerHeight;
  const fitsAbove = a.top - gap - f.height >= 0;
  const below = side === "bottom" ? fitsBelow || !fitsAbove : !fitsAbove && fitsBelow;
  const top = below ? a.bottom + gap : a.top - gap - f.height;
  let left = align === "center" ? a.left + a.width / 2 - f.width / 2 : a.left;
  left = Math.min(Math.max(gap, left), window.innerWidth - f.width - gap);
  floating.style.position = "fixed";
  floating.style.inset = `${top}px auto auto ${left}px`;
  floating.style.margin = "0";
}
