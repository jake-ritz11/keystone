/**
 * The tokens in the W3C Design Tokens format (DTCG 2025.10), for tools that read it: Style
 * Dictionary, Figma plugins, other platforms. Semantic colors stay references to the palette
 * (`{palette.blue.600}`), so the two tiers survive the export.
 */
import { font, highContrast, motion, palette, radius, semantic, space } from "./index.ts";

type Token = { $type?: string; $value: unknown; $description?: string };
type Group = { [key: string]: Token | Group | string | undefined; $type?: string; $description?: string };

/** `#rrggbb` or `#rrggbbaa` as a DTCG color value. */
function colorValue(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const alpha = hex.length === 9 ? Number.parseInt(hex.slice(7, 9), 16) / 255 : 1;
  return { colorSpace: "srgb", components: [r, g, b], alpha: Math.round(alpha * 1000) / 1000, hex: hex.slice(0, 7) };
}

const colorToken = (value: string): Token => {
  const ref = /^\{(\w+)\.(\w+)\}$/.exec(value);
  return { $value: ref ? `{palette.${ref[1]}.${ref[2]}}` : colorValue(value) };
};

const dimension = (px: string) => ({ value: Number.parseFloat(px), unit: "px" });

const group = (type: string, values: Record<string, unknown>, toValue: (v: never) => unknown): Group => ({
  $type: type,
  ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { $value: toValue(v as never) }])),
});

export function toDTCG(): Group {
  return {
    $description: "Keystone design tokens. Components read only the color themes, never the palette.",
    palette: {
      $type: "color",
      ...Object.fromEntries(
        Object.entries(palette).map(([hue, steps]) => [
          hue,
          Object.fromEntries(Object.entries(steps).map(([step, hex]) => [step, { $value: colorValue(hex) }])),
        ]),
      ),
    },
    color: {
      $type: "color",
      $description: "What each color is for, per theme. High-contrast themes hold only what changes.",
      light: Object.fromEntries(Object.entries(semantic.light).map(([k, v]) => [k, colorToken(v)])),
      dark: Object.fromEntries(Object.entries(semantic.dark).map(([k, v]) => [k, colorToken(v)])),
      lightHighContrast: Object.fromEntries(Object.entries(highContrast.light).map(([k, v]) => [k, colorToken(v)])),
      darkHighContrast: Object.fromEntries(Object.entries(highContrast.dark).map(([k, v]) => [k, colorToken(v)])),
    },
    space: group("dimension", space, dimension),
    radius: group("dimension", radius, dimension),
    font: {
      family: group("fontFamily", font.family, (stack: string) => stack.split(",").map((f) => f.trim().replace(/^'|'$/g, ""))),
      size: group("dimension", font.size, dimension),
      weight: group("fontWeight", font.weight, (w: string) => Number(w)),
      lineHeight: group("number", font.lineHeight, (n: string) => Number(n)),
    },
    motion: {
      duration: group("duration", motion.duration, (ms: string) => ({ value: Number.parseFloat(ms), unit: "ms" })),
      easing: group("cubicBezier", motion.easing, (curve: string) => curve.match(/[\d.]+/g)!.map(Number)),
    },
  };
}
