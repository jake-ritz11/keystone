/**
 * Design tokens, in two tiers. The palette holds every raw color; the semantic tokens say what a
 * color is for (`accent`, `textMuted`) and point at a palette step for each theme. Components
 * only ever read the semantic tier, through CSS variables (`var(--ks-color-accent)`), and the
 * MCP audit flags anything that doesn't.
 */

export { contrastRatio } from "./contrast.ts";

/** Every raw color in the system. Steps run light (0) to dark (1000). */
export const palette = {
  neutral: {
    0: "#ffffff",
    25: "#fbfaf8",
    50: "#f3f1ed",
    75: "#f1eee8",
    150: "#e2ded6",
    250: "#c9c3b8",
    400: "#a39d92",
    500: "#8a847a",
    550: "#77726a",
    600: "#6b665e",
    700: "#4f4b44",
    800: "#38352f",
    850: "#262421",
    900: "#1c1b19",
    950: "#141312",
    1000: "#000000",
  },
  blue: {
    200: "#b8c6fa",
    300: "#97abf8",
    400: "#7c95f5",
    600: "#3b5bdb",
    700: "#2f4bc2",
    800: "#233a9c",
    900: "#1a2b75",
    950: "#0f1220",
  },
  red: {
    200: "#ffa8a8",
    300: "#ff8787",
    400: "#ff6b6b",
    600: "#c92a2a",
    700: "#a61e1e",
    800: "#8a1414",
  },
  green: {
    200: "#8ce99a",
    300: "#69db7c",
    600: "#2b8a3e",
    700: "#22702f",
  },
} as const;

type Palette = typeof palette;
/** A palette step, written the way DTCG writes references: `{blue.600}`. */
export type PaletteRef = { [H in keyof Palette]: `{${H}.${keyof Palette[H] & (string | number)}}` }[keyof Palette];
type SemanticValue = PaletteRef | `#${string}`;

const semanticLight = {
  bg: "{neutral.25}",
  surface: "{neutral.0}",
  surfaceRaised: "{neutral.50}",
  border: "{neutral.150}",
  /** Hover borders on fields and other outlined controls. */
  borderStrong: "{neutral.250}",
  /** Outlines that identify a control, like a text field's: at least 3:1 against any surface. */
  borderControl: "{neutral.500}",
  borderControlHover: "{neutral.700}",
  text: "{neutral.900}",
  textMuted: "{neutral.600}",
  accent: "{blue.600}",
  accentHover: "{blue.700}",
  accentText: "{neutral.0}",
  danger: "{red.600}",
  dangerHover: "{red.700}",
  success: "{green.600}",
  focus: "{blue.600}",
  // Overlays are translucent, so they're the one place a semantic token holds its own value.
  /** Behind modal layers. */
  scrim: "#1c1b1966",
  /** Elevation shadows for popovers and dialogs. */
  shadow: "#1c1b1924",
} as const satisfies Record<string, SemanticValue>;

export type ColorToken = keyof typeof semanticLight;

/** The semantic tier: what each color is for, per theme, as palette references. */
export const semantic = {
  light: semanticLight,
  dark: {
    bg: "{neutral.950}",
    surface: "{neutral.900}",
    surfaceRaised: "{neutral.850}",
    border: "{neutral.800}",
    borderStrong: "{neutral.700}",
    borderControl: "{neutral.550}",
    borderControlHover: "{neutral.400}",
    text: "{neutral.75}",
    textMuted: "{neutral.400}",
    accent: "{blue.400}",
    accentHover: "{blue.300}",
    accentText: "{blue.950}",
    danger: "{red.400}",
    dangerHover: "{red.300}",
    success: "{green.300}",
    focus: "{blue.300}",
    scrim: "#000000a6",
    shadow: "#00000080",
  },
} as const satisfies Record<"light" | "dark", Record<ColorToken, SemanticValue>>;

/**
 * High contrast, for `prefers-contrast: more`: only what changes from each theme. Muted text and
 * borders move toward the text color, so all text clears 7:1 and every outline 4.5:1.
 */
export const highContrast = {
  light: {
    border: "{neutral.600}",
    borderStrong: "{neutral.700}",
    borderControl: "{neutral.700}",
    borderControlHover: "{neutral.900}",
    textMuted: "{neutral.700}",
    accent: "{blue.800}",
    accentHover: "{blue.900}",
    danger: "{red.700}",
    dangerHover: "{red.800}",
    success: "{green.700}",
    focus: "{blue.800}",
  },
  dark: {
    bg: "{neutral.1000}",
    border: "{neutral.400}",
    borderStrong: "{neutral.150}",
    borderControl: "{neutral.250}",
    borderControlHover: "{neutral.75}",
    text: "{neutral.0}",
    textMuted: "{neutral.250}",
    accent: "{blue.300}",
    accentHover: "{blue.200}",
    danger: "{red.300}",
    dangerHover: "{red.200}",
    success: "{green.200}",
    focus: "{blue.200}",
  },
} as const satisfies Record<"light" | "dark", Partial<Record<ColorToken, SemanticValue>>>;

const REF = /^\{(\w+)\.(\w+)\}$/;

/** The hex value behind a semantic value. */
export function resolve(value: SemanticValue): string {
  const ref = REF.exec(value);
  if (!ref) return value;
  const hue = palette[ref[1] as keyof Palette] as Record<string, string> | undefined;
  const hex = hue?.[ref[2]!];
  if (!hex) throw new Error(`Unknown palette reference ${value}`);
  return hex;
}

const resolveAll = <K extends string>(tokens: Partial<Record<K, SemanticValue>>) =>
  Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, resolve(v as SemanticValue)])) as Record<K, string>;

/** Every semantic color resolved to hex, per theme: what the CSS variables end up holding. */
export const color: Record<"light" | "dark", Record<ColorToken, string>> = {
  light: resolveAll(semantic.light),
  dark: resolveAll(semantic.dark),
};

/** The same, with the high-contrast changes applied. */
export const colorHighContrast: Record<"light" | "dark", Record<ColorToken, string>> = {
  light: { ...color.light, ...resolveAll<ColorToken>(highContrast.light) },
  dark: { ...color.dark, ...resolveAll<ColorToken>(highContrast.dark) },
};

/** 4px base scale. */
export const space = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
} as const;

/**
 * The smallest a control's hit area can be. `min` is WCAG 2.5.8's floor for every pointer;
 * `touch` is Apple's minimum, for coarse pointers, where a fingertip is the pointer.
 */
export const target = {
  min: "24px",
  touch: "44px",
} as const;

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
} as const;

export const font = {
  family: {
    // The apps self-host the variable fonts (@fontsource-variable), so text is set the same,
    // and sits the same in its box, on every operating system. The rest are fallbacks.
    sans: "'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace",
  },
  size: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "18px",
    xl: "24px",
    "2xl": "32px",
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
  },
  lineHeight: {
    tight: "1.2",
    normal: "1.5",
  },
} as const;

export const motion = {
  duration: {
    fast: "120ms",
    normal: "200ms",
    slow: "320ms",
    /** One cycle of a looping "still working" indicator: slow enough to read as calm. */
    ambient: "2000ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.3, 0, 0, 1.3)",
  },
} as const;

export type Theme = keyof typeof color;

const kebab = (key: string): string => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function flatten(prefix: string, values: Record<string, unknown>, out: Record<string, string>): void {
  for (const [key, value] of Object.entries(values)) {
    const name = `${prefix}-${kebab(key)}`;
    if (typeof value === "object" && value !== null) {
      flatten(name, value as Record<string, unknown>, out);
    } else {
      out[name] = String(value);
    }
  }
}

/**
 * The tight line height is written to CSS rounded up to a whole, even number of pixels. At
 * 1.2 times 14px the line box is 16.8px, and the browser then snaps the text to a pixel edge,
 * which left labels in buttons and tabs 0.9px off center. An even line box centers them exactly.
 * The token itself stays the ratio, for TypeScript and the W3C export.
 */
const tightLineHeight = (out: Record<string, string>) => {
  out["--ks-font-line-height-tight"] = `round(up, ${font.lineHeight.tight}em, 2px)`;
};

const paletteVar = (value: SemanticValue) => {
  const ref = REF.exec(value);
  return ref ? `var(--ks-palette-${ref[1]}-${ref[2]})` : value;
};

const colorVariables = (tokens: Partial<Record<ColorToken, SemanticValue>>): Record<string, string> =>
  Object.fromEntries(Object.entries(tokens).map(([k, v]) => [`--ks-color-${kebab(k)}`, paletteVar(v as SemanticValue)]));

/** Every token as a `--ks-*` CSS custom property, resolved to raw values, for the given color theme. */
export function cssVariables(theme: Theme, contrast: "normal" | "more" = "normal"): Record<string, string> {
  const out: Record<string, string> = {};
  flatten("--ks-color", contrast === "more" ? colorHighContrast[theme] : color[theme], out);
  flatten("--ks-space", space, out);
  flatten("--ks-target", target, out);
  flatten("--ks-radius", radius, out);
  flatten("--ks-font", font, out);
  tightLineHeight(out);
  flatten("--ks-motion", motion, out);
  return out;
}

const block = (selector: string, vars: Record<string, string>): string =>
  `${selector}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("")}}`;

/** A rule inside zero or more nested media queries. */
const rule = (media: string[], selector: string, vars: Record<string, string>): string =>
  media.reduceRight((inner, query) => `@media ${query}{${inner}}`, block(selector, vars));

/**
 * When each theme applies: by the system setting unless `data-theme` pins one. The two lists
 * never match at the same time, so their rules can't fight over specificity.
 */
const THEME_WHEN: Record<Theme, [media: string[], selector: string][]> = {
  light: [
    [["(prefers-color-scheme: light)"], ':root:not([data-theme="dark"])'],
    [[], ':root[data-theme="light"]'],
  ],
  dark: [
    [["(prefers-color-scheme: dark)"], ':root:not([data-theme="light"])'],
    [[], ':root[data-theme="dark"]'],
  ],
};

/** When high contrast applies: by the system setting unless `data-contrast` pins it. */
const MORE_CONTRAST_WHEN: [media: string[], suffix: string][] = [
  [["(prefers-contrast: more)"], ':not([data-contrast="normal"])'],
  [[], '[data-contrast="more"]'],
];

/**
 * The full token stylesheet. The palette is declared once and semantic colors point at it, so
 * dev tools show `--ks-color-accent: var(--ks-palette-blue-600)`. Light by default; dark under
 * `prefers-color-scheme` unless `data-theme` pins a theme; high contrast under
 * `prefers-contrast: more` unless `data-contrast` pins it.
 */
export function tokenStylesheet(): string {
  const base: Record<string, string> = {};
  flatten("--ks-palette", palette, base);
  Object.assign(base, colorVariables(semantic.light));
  flatten("--ks-space", space, base);
  flatten("--ks-target", target, base);
  flatten("--ks-radius", radius, base);
  flatten("--ks-font", font, base);
  tightLineHeight(base);
  flatten("--ks-motion", motion, base);
  const dark = colorVariables(semantic.dark);
  const rules = [
    block(":root", base),
    rule(["(prefers-color-scheme: dark)"], ':root:not([data-theme="light"])', dark),
    block(':root[data-theme="dark"]', dark),
  ];
  for (const theme of ["light", "dark"] as const) {
    const vars = colorVariables(highContrast[theme]);
    for (const [themeMedia, selector] of THEME_WHEN[theme]) {
      for (const [contrastMedia, suffix] of MORE_CONTRAST_WHEN) {
        rules.push(rule([...themeMedia, ...contrastMedia], selector + suffix, vars));
      }
    }
  }
  return rules.join("\n");
}
