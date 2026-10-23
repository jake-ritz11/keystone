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

## As data

```ts
import { color, space, cssVariables, tokenStylesheet } from "@keystone-ui/tokens";

color.dark.accent; // "#7c95f5"
cssVariables("light")["--ks-space-4"]; // "16px"
tokenStylesheet(); // the same CSS as tokens.css, e.g. to inline in a <style> tag
```
