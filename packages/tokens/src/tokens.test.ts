import assert from "node:assert/strict";
import { test } from "node:test";
import { color, colorHighContrast, contrastRatio, highContrast, palette, resolve, semantic, tokenStylesheet } from "./index.ts";
import { toDTCG } from "./dtcg.ts";

type Colors = (typeof color)["light"];

/** Pairs a person has to read or find, the surfaces they sit on, and the WCAG minimum. */
function pairs(c: Colors, more: boolean): [string, string, string, number][] {
  const text = more ? 7 : 4.5;
  const surfaces = ["bg", "surface", "surfaceRaised"] as const;
  return [
    ...surfaces.flatMap((s) => [
      [`text on ${s}`, c.text, c[s], text] as [string, string, string, number],
      [`textMuted on ${s}`, c.textMuted, c[s], text] as [string, string, string, number],
      // Links and selected items are accent text; raised surfaces hold hover rows.
      [`accent on ${s}`, c.accent, c[s], s === "surfaceRaised" && !more ? 4.5 : more ? 6 : 4.5] as [string, string, string, number],
      // A control's outline is what makes it findable (WCAG 1.4.11).
      [`borderControl on ${s}`, c.borderControl, c[s], more ? 4.5 : 3] as [string, string, string, number],
    ]),
    ["accentText on accent", c.accentText, c.accent, text],
    ["accentText on danger", c.accentText, c.danger, more ? 7 : 4.5],
    ["danger on surface", c.danger, c.surface, text],
    ["success on surface (icons)", c.success, c.surface, 3],
    ["focus on bg", c.focus, c.bg, 3],
    ["focus on surface", c.focus, c.surface, 3],
  ];
}

for (const [label, set, more] of [
  ["", color, false],
  ["high contrast ", colorHighContrast, true],
] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`${label}${theme}: every text and control pair meets its WCAG minimum`, () => {
      const failures = pairs(set[theme], more)
        .map(([name, a, b, min]) => ({ name, ratio: contrastRatio(a, b), min }))
        .filter(({ ratio, min }) => ratio < min)
        .map(({ name, ratio, min }) => `${name}: ${ratio.toFixed(2)} < ${min}`);
      assert.deepEqual(failures, []);
    });
  }
}

test("high contrast only ever raises contrast against the page", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const key of ["text", "textMuted", "borderControl", "accent"] as const) {
      const before = contrastRatio(color[theme][key], color[theme].bg);
      const after = contrastRatio(colorHighContrast[theme][key], colorHighContrast[theme].bg);
      assert.ok(after >= before, `${theme} ${key}: ${before.toFixed(2)} -> ${after.toFixed(2)}`);
    }
  }
});

test("every semantic color resolves to a palette step or a translucent overlay", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const [key, value] of Object.entries(semantic[theme])) {
      if (value.startsWith("#")) assert.ok(["scrim", "shadow"].includes(key), `${theme}.${key} holds a raw value`);
      else assert.match(resolve(value), /^#[0-9a-f]{6}$/);
    }
  }
});

test("every palette step is used by some theme", () => {
  const used = new Set(
    [semantic.light, semantic.dark, highContrast.light, highContrast.dark].flatMap((t) => Object.values(t) as string[]),
  );
  const unused = Object.entries(palette).flatMap(([hue, steps]) =>
    Object.keys(steps)
      .map((step) => `{${hue}.${step}}`)
      .filter((ref) => !used.has(ref)),
  );
  assert.deepEqual(unused, []);
});

test("the stylesheet points semantic colors at the palette, and pins themes and contrast", () => {
  const css = tokenStylesheet();
  assert.match(css, /--ks-palette-blue-600:#3b5bdb;/);
  assert.match(css, /--ks-color-accent:var\(--ks-palette-blue-600\);/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  assert.match(css, /:root\[data-theme="dark"\]\[data-contrast="more"\]\{/);
});

test("the DTCG export keeps the two tiers and uses spec value shapes", () => {
  const tokens = toDTCG() as Record<string, any>;
  assert.equal(tokens.palette.$type, "color");
  assert.deepEqual(tokens.palette.blue["600"].$value, {
    colorSpace: "srgb",
    components: [0x3b / 255, 0x5b / 255, 0xdb / 255],
    alpha: 1,
    hex: "#3b5bdb",
  });
  assert.equal(tokens.color.light.accent.$value, "{palette.blue.600}");
  assert.equal(tokens.color.light.scrim.$value.alpha, 0.4);
  assert.deepEqual(tokens.space["4"].$value, { value: 16, unit: "px" });
  assert.deepEqual(tokens.motion.easing.standard.$value, [0.2, 0, 0, 1]);
  assert.deepEqual(tokens.motion.duration.ambient.$value, { value: 2000, unit: "ms" });
  assert.deepEqual(tokens.font.family.mono.$value, ["JetBrains Mono", "ui-monospace", "Cascadia Code", "monospace"]);
  // Every reference points at a real palette token.
  const refs = JSON.stringify(tokens).match(/\{palette\.\w+\.\w+\}/g) ?? [];
  for (const ref of refs) {
    const [, hue, step] = ref.slice(1, -1).split(".");
    assert.ok(tokens.palette[hue!]?.[step!], ref);
  }
});
