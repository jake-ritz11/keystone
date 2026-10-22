---
name: keystone-components
description: Build or change a React component in the Keystone design system. Use whenever a task adds or edits anything under packages/ui, or asks for UI built "with Keystone".
---

# Building Keystone components

1. **Get the tokens first.** Call the `get_tokens` tool from the `keystone` MCP server, or read
   `packages/tokens/src/index.ts`. Every color, space, radius, font and motion value comes from a
   `--ks-*` CSS variable. No hex, rgb(), hsl() or raw px for spacing.
2. **One folder per component**: `packages/ui/src/<name>/<Name>.tsx` and `<Name>.module.css`,
   exported from `packages/ui/src/index.ts`. Follow `button/` as the reference. For a new
   component, `generate_component` returns a clean scaffold to start from.
3. **Accessibility is part of done:**
   - Real elements first: `<button>` for actions, `<a>` for navigation. A `div` with `onClick` is a bug.
   - Every interactive state has a `:focus-visible` style built on `--ks-color-focus`.
   - Every transition or animation has a `prefers-reduced-motion: reduce` fallback.
   - Forward refs and spread the remaining native props so callers keep full control.
4. **Audit before you hand it over.** Call `audit_component` on each file you wrote, or run
   `npm run audit:ui`. Fix every finding; don't explain it away.
5. **Show it.** Add the component to `apps/docs/app/page.tsx` in every variant and state, then
   check it in light and dark.
