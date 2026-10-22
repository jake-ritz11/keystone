# Keystone

A token-driven React design system (npm workspaces): `packages/tokens`, `packages/ui`,
`packages/mcp`, `apps/docs`. See README.md for the map and roadmap.

## Rules

- **Tokens only.** No hex, rgb(), hsl() or raw px spacing in components. Read
  `packages/tokens/src/index.ts` or call the keystone MCP `get_tokens` tool.
- **Building or editing a component?** Follow `.claude/skills/keystone-components/SKILL.md`.
- **Accessibility is part of done**: real elements, `:focus-visible`, a reduced-motion fallback,
  and light and dark both checked.
- Packages ship TypeScript source. The docs app compiles them via `transpilePackages`; the MCP
  server runs on Node 24's built-in type stripping, so it uses only erasable TS syntax and
  imports local files with a `.ts` extension.
- Components with event handlers or state start with `"use client"`.

## Validation

`npm run check` must pass: typecheck, tests (`node --test`), the design-system audit, the
Next production build, and the Playwright behavior tests in `apps/docs/tests`. A component with
interactive behavior gets a spec there. Verify visual changes in the browser in both themes.

## Working style

- Jake is building this as a portfolio for frontend / design-engineer roles. Craft and honest
  write-ups matter more than feature count.
- This project is unrelated to any game work. Keep names, copy and examples neutral.
- Never add Claude as a commit co-author.
