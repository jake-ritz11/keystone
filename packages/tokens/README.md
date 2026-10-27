# @keystone-ui/tokens

The design tokens behind [Keystone](https://github.com/jake-ritz11/keystone): color for light and
dark, a 4px space scale, radius, type and motion.

## As CSS variables

```ts
import "@keystone-ui/tokens/tokens.css";
```

```css
.card {
  padding: var(--ks-space-4);
  border-radius: var(--ks-radius-lg);
  background: var(--ks-color-surface);
  color: var(--ks-color-text);
}
```

Dark values apply under `prefers-color-scheme: dark`, unless `<html data-theme="light">` pins
light. `data-theme="dark"` pins dark.

High-contrast values apply under `prefers-contrast: more`, unless `data-contrast="normal"` pins
normal contrast. `data-contrast="more"` pins high contrast. They combine with either theme.

## Two tiers

`--ks-palette-*` is every raw color, by hue and step. `--ks-color-*` says what a color is for
and points at a palette step in each theme: `--ks-color-accent: var(--ks-palette-blue-600)`.
Style components with `--ks-color-*` only; the palette doesn't follow the theme or high
contrast. Keystone's audit flags palette steps in component CSS.

Every pair that has to be read or found is unit-tested against WCAG: 4.5:1 for text and 3:1
for control outlines, rising to 7:1 and 4.5:1 in high contrast.

## As design tokens JSON

`@keystone-ui/tokens/tokens.json` holds the same tokens in the
[W3C Design Tokens format](https://www.designtokens.org/), for Style Dictionary, Figma plugins
and other platforms. Semantic colors stay references to the palette (`{palette.blue.600}`).

## As data

```ts
import { color, colorHighContrast, contrastRatio, space, cssVariables, tokenStylesheet } from "@keystone-ui/tokens";

color.dark.accent; // "#7c95f5"
colorHighContrast.light.textMuted; // "#4f4b44"
contrastRatio(color.light.text, color.light.bg); // 16.5
cssVariables("light")["--ks-space-4"]; // "16px"
tokenStylesheet(); // the same CSS as tokens.css, e.g. to inline in a <style> tag
```
