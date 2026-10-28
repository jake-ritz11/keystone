import { test } from "node:test";
import assert from "node:assert/strict";
import { anchorName, placeFallback } from "./anchor.ts";

// placeFallback only runs where CSS anchor positioning is missing. Every engine Keystone is
// tested in has it, so the math is checked here against stubbed rects and a 1000x800 viewport.

type Rect = { top: number; left: number; width: number; height: number };

function el(rect: Rect) {
  const style: Record<string, string> = {};
  const box = { ...rect, bottom: rect.top + rect.height, right: rect.left + rect.width };
  return { style, getBoundingClientRect: () => box } as unknown as HTMLElement & { style: Record<string, string> };
}

function withViewport(supportsAnchor: boolean, run: () => void) {
  const g = globalThis as Record<string, unknown>;
  const saved = { CSS: g.CSS, window: g.window };
  g.CSS = { supports: () => supportsAnchor };
  g.window = { innerWidth: 1000, innerHeight: 800 };
  try {
    run();
  } finally {
    g.CSS = saved.CSS;
    g.window = saved.window;
  }
}

test("anchorName makes a valid dashed ident from a useId value", () => {
  assert.equal(anchorName("«r1»"), "--ks-anchor-r1");
  assert.equal(anchorName("_R_2ein_"), "--ks-anchor-_R_2ein_");
});

test("does nothing where the browser positions it natively", () => {
  withViewport(true, () => {
    const floating = el({ top: 0, left: 0, width: 100, height: 40 });
    placeFallback(el({ top: 100, left: 100, width: 80, height: 30 }), floating, "bottom", "start", 4);
    assert.deepEqual(floating.style, {});
  });
});

test("bottom/start sits under the anchor's left edge", () => {
  withViewport(false, () => {
    const floating = el({ top: 0, left: 0, width: 200, height: 120 });
    placeFallback(el({ top: 100, left: 300, width: 80, height: 30 }), floating, "bottom", "start", 4);
    assert.equal(floating.style.inset, "134px auto auto 300px");
    assert.equal(floating.style.position, "fixed");
  });
});

test("bottom/end lines its right edge up with the anchor's", () => {
  withViewport(false, () => {
    const floating = el({ top: 0, left: 0, width: 200, height: 120 });
    placeFallback(el({ top: 100, left: 300, width: 80, height: 30 }), floating, "bottom", "end", 4);
    assert.equal(floating.style.inset, "134px auto auto 180px");
  });
});

test("bottom flips above when there's no room below", () => {
  withViewport(false, () => {
    const floating = el({ top: 0, left: 0, width: 200, height: 120 });
    placeFallback(el({ top: 740, left: 300, width: 80, height: 30 }), floating, "bottom", "start", 4);
    assert.equal(floating.style.inset, "616px auto auto 300px");
  });
});

test("top/center centers over the anchor and flips below near the top edge", () => {
  withViewport(false, () => {
    const above = el({ top: 0, left: 0, width: 100, height: 24 });
    placeFallback(el({ top: 300, left: 400, width: 60, height: 30 }), above, "top", "center", 8);
    assert.equal(above.style.inset, "268px auto auto 380px");

    const below = el({ top: 0, left: 0, width: 100, height: 24 });
    placeFallback(el({ top: 10, left: 400, width: 60, height: 30 }), below, "top", "center", 8);
    assert.equal(below.style.inset, "48px auto auto 380px");
  });
});

test("keeps it inside the viewport horizontally", () => {
  withViewport(false, () => {
    const left = el({ top: 0, left: 0, width: 200, height: 24 });
    placeFallback(el({ top: 300, left: 0, width: 40, height: 30 }), left, "top", "center", 8);
    assert.equal(left.style.inset, "268px auto auto 8px");

    const right = el({ top: 0, left: 0, width: 200, height: 24 });
    placeFallback(el({ top: 300, left: 960, width: 40, height: 30 }), right, "bottom", "start", 8);
    assert.equal(right.style.inset, "338px auto auto 792px");
  });
});
