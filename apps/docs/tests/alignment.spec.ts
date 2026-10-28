/**
 * Optical alignment, measured rather than eyeballed. For every control in every example, the
 * text's cap height has to sit centered in the control's box, an icon has to center on the
 * text beside it, and a checkbox, radio or switch has to center on its label's first line, each
 * within half a pixel. Text is set in Inter on every OS now (the apps self-host it), so the numbers
 * are the same everywhere; with the system's fallback font they were up to 0.9px out.
 */
import { expect, test } from "@playwright/test";
import { COMPONENTS } from "@keystone-ui/ui/docs";
import { open } from "./open";

const TOLERANCE = 0.5;

function measure(tolerance: number) {
  const capHeight = (el: Element) => {
    const cs = getComputedStyle(el);
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return ctx.measureText("H").actualBoundingBoxAscent;
  };
  const firstText = (el: Element) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent!.trim() ? 1 : 3) });
    return walker.nextNode() as Text | null;
  };
  // The baseline of an element's first text: the text is wrapped in an inline span for the
  // measurement (in a flex container a bare probe would become a flex item) and unwrapped after.
  const baseline = (text: Text) => {
    const wrap = document.createElement("span");
    text.replaceWith(wrap);
    wrap.append(text);
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    wrap.prepend(probe);
    const y = probe.getBoundingClientRect().bottom;
    wrap.replaceWith(text);
    return y;
  };
  const visible = (el: Element) => {
    const box = el.getBoundingClientRect();
    return box.height > 0 && getComputedStyle(el).visibility !== "hidden";
  };

  const problems: string[] = [];
  const name = (el: Element) => `${el.tagName.toLowerCase()} "${el.textContent!.trim().slice(0, 24)}"`;

  for (const el of document.querySelectorAll<HTMLElement>('.example-preview :is(button, summary, [class*="_badge"])')) {
    const text = firstText(el);
    if (!text || !visible(el) || !visible(text.parentElement!)) continue;
    const box = el.getBoundingClientRect();
    if (box.height > 60) continue; // a container, not a control
    // Text that is visually hidden (an icon button's label) has nothing to center.
    if (text.parentElement!.getBoundingClientRect().height <= 1) continue;
    const cs = getComputedStyle(el);
    const top = box.top + parseFloat(cs.borderTopWidth);
    const bottom = box.bottom - parseFloat(cs.borderBottomWidth);
    const base = baseline(text);
    const cap = capHeight(text.parentElement!);
    const offset = (base - cap - top - (bottom - base)) / 2;
    if (Math.abs(offset) > tolerance) problems.push(`${name(el)}: text is ${offset.toFixed(1)}px off center`);
    const icon = el.querySelector(":scope svg");
    if (icon && visible(icon)) {
      const i = icon.getBoundingClientRect();
      const iconOffset = i.top + i.height / 2 - (base - cap / 2);
      if (Math.abs(iconOffset) > tolerance) problems.push(`${name(el)}: icon is ${iconOffset.toFixed(1)}px off the text`);
    }
  }

  for (const input of document.querySelectorAll<HTMLInputElement>('.example-preview input:is([type="checkbox"], [type="radio"])')) {
    const label = input.labels?.[0];
    const text = label && firstText(label);
    if (!text || !visible(input)) continue;
    const b = input.getBoundingClientRect();
    const offset = b.top + b.height / 2 - (baseline(text) - capHeight(label) / 2);
    if (Math.abs(offset) > tolerance) problems.push(`${input.getAttribute("role") ?? input.type} "${label.textContent!.trim()}": control is ${offset.toFixed(1)}px off its label`);
  }
  return problems;
}

for (const { slug } of COMPONENTS) {
  test(`/components/${slug}: text, icons and controls are centered within ${TOLERANCE}px`, async ({ page }) => {
    await open(page, `/components/${slug}`);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(measure, TOLERANCE)).toEqual([]);
  });
}
