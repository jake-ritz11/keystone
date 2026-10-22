# Keystone

A token-driven React design system with an MCP server and Claude skills, so Claude can build
components *from* the system and check its own work against it.

| Package | What it is |
| --- | --- |
| [`packages/tokens`](packages/tokens) | Design tokens (color for light and dark, space, radius, type, motion), the single source of truth |
| [`packages/ui`](packages/ui) | React components built only from tokens: accessible, themeable, reduced-motion aware |
| [`packages/mcp`](packages/mcp) | MCP server: `get_tokens`, `audit_component`, plus a CLI audit |
| [`apps/docs`](apps/docs) | Next.js docs site and component playground |
| [`.claude/skills`](.claude/skills) | Claude skills that teach the rules (`keystone-components`) |

## Run it

Requires Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev        # docs site at http://localhost:3000
npm run check      # typecheck, tests, design-system audit, production build
```

The MCP server is registered in [`.mcp.json`](.mcp.json), so Claude Code picks it up when it
opens this folder. Other clients can run `node packages/mcp/src/server.ts` over stdio.

## The audit

`npm run audit:ui` checks every component file for:

- **hard-coded-color**: hex, `rgb()` or `hsl()` instead of a `--ks-color-*` token
- **off-scale-spacing**: raw px padding, margin or gap instead of `--ks-space-*`
- **missing-focus-visible**: a `cursor: pointer` with no `:focus-visible` style
- **missing-reduced-motion**: motion with no `prefers-reduced-motion` fallback
- **clickable-non-button**: a `div` or `span` with `onClick` and no role

## Roadmap

1. **The kit**: core components (input, select, dialog, menu, tabs, tooltip, toast), token
   docs, a "generate component" MCP tool, and a published package.
2. **An agent interface built on the kit**: a web app for working with an AI agent (plans,
   tool calls, diffs, approvals), with each interaction idea as a switchable variant.
3. **A user study**: testers switch variants and suggest changes in the app, with consent-based
   logging. The results get published as a case study.
