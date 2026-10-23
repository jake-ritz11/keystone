/**
 * Design tokens. Components never use raw values; they read these through CSS
 * variables (`var(--ks-color-accent)`), and the MCP audit flags anything that doesn't.
 */

export const color = {
  light: {
    bg: "#fbfaf8",
    surface: "#ffffff",
    surfaceRaised: "#f3f1ed",
    border: "#e2ded6",
    /** Hover borders on fields and other outlined controls. */
    borderStrong: "#c9c3b8",
    text: "#1d1b18",
    textMuted: "#6b665e",
    accent: "#3b5bdb",
    accentHover: "#2f4bc2",
    accentText: "#ffffff",
    danger: "#c92a2a",
    dangerHover: "#a61e1e",
    success: "#2b8a3e",
    focus: "#3b5bdb",
    /** Behind modal layers. */
    scrim: "#1d1b1866",
    /** Elevation shadows for popovers and dialogs. */
    shadow: "#1d1b1824",
  },
  dark: {
    bg: "#141312",
    surface: "#1c1b19",
    surfaceRaised: "#262421",
    border: "#38352f",
    borderStrong: "#4f4b44",
    text: "#f1eee8",
    textMuted: "#a39d92",
    accent: "#7c95f5",
    accentHover: "#97abf8",
    accentText: "#0f1220",
    danger: "#ff6b6b",
    dangerHover: "#ff8787",
    success: "#69db7c",
    focus: "#97abf8",
    scrim: "#000000a6",
    shadow: "#00000080",
  },
} as const;

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

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
} as const;

export const font = {
  family: {
    sans: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace",
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

/** Every token as a `--ks-*` CSS custom property, for the given color theme. */
export function cssVariables(theme: Theme): Record<string, string> {
  const out: Record<string, string> = {};
  flatten("--ks-color", color[theme], out);
  flatten("--ks-space", space, out);
  flatten("--ks-radius", radius, out);
  flatten("--ks-font", font, out);
  flatten("--ks-motion", motion, out);
  return out;
}

const block = (selector: string, vars: Record<string, string>): string =>
  `${selector}{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("")}}`;

/**
 * The full token stylesheet: light by default, dark under `prefers-color-scheme`
 * unless the page pins `data-theme="light"`, and dark when it pins `data-theme="dark"`.
 */
export function tokenStylesheet(): string {
  const dark = cssVariables("dark");
  return [
    block(":root", cssVariables("light")),
    `@media (prefers-color-scheme: dark){${block(':root:not([data-theme="light"])', dark)}}`,
    block(':root[data-theme="dark"]', dark),
  ].join("\n");
}
