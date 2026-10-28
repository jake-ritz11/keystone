# Keystone

A token-driven React design system with an MCP server and Claude skills, so Claude can build
components *from* the system and check its own work against it.

| Package | What it is |
| --- | --- |
| [`packages/tokens`](packages/tokens) | Design tokens (color for light and dark, space, radius, type, motion), the single source of truth |
| [`packages/ui`](packages/ui) | React components built only from tokens: accessible, themeable, reduced-motion aware |
| [`packages/mcp`](packages/mcp) | MCP server: `get_tokens`, `get_component`, `audit_component`, `generate_component`, plus a CLI audit |
| [`apps/docs`](apps/docs) | Next.js docs site and component playground |
| [`apps/agent`](apps/agent) | The agent interface (phase 2): work with a coding agent, with switchable interaction variants |
| [`packages/agent-core`](packages/agent-core) | The agent's logic, without React: sandboxed workspace, tools, diffs, session reducer, replays |
| [`.claude/skills`](.claude/skills) | Claude skills that teach the rules (`keystone-components`) |

## Run it

Requires Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev        # docs site at http://localhost:3000
npm run dev:agent  # agent app at http://localhost:3001 (replays; no API key needed)
npm run check      # typecheck, unit tests, audit, package build, docs build, behavior tests
```

For live sessions in the agent app, copy `apps/agent/.env.example` to `apps/agent/.env.local`
and set `ANTHROPIC_API_KEY`. The key stays on the server: the browser sends only the
conversation, and the route builds the prompt and tools itself, rate-limits, and enforces a
daily token budget.

`npm run build:packages` compiles `@keystone-ui/tokens` and `@keystone-ui/ui` into each
package's `dist/`: ESM, type declarations, `tokens.css` and one `styles.css` with scoped class
names, so the published packages work in any React setup without extra config. Smoke tests
render every component from the built bundle and type-check a consumer against the built
declarations. Publish with `npm publish packages/ui/dist`.

The behavior tests (`apps/docs/tests`) drive the production docs build in Chromium and WebKit
with Playwright: keyboard models, focus return, ARIA wiring, light dismiss, and the WCAG timing and
hover rules for tooltips and toasts. Real engines rather than jsdom, because the components
are built on `<dialog>`, `popover` and anchor positioning, which jsdom doesn't implement. The
first run needs `npx -w apps/docs playwright install chromium webkit`. CI runs `check` and the Firefox
tests on every push. Firefox is left out of the local `check` because it won't launch on the
Windows machine this was built on; run it with `npm run test:e2e:firefox -w apps/docs`.

Visual regression (`apps/docs/tests-visual`) screenshots every example on every component page,
plus the open states of the overlays, in light and dark, and compares them with committed
baselines. Fonts render differently on each operating system, so the baselines come from the
same Linux Playwright image CI uses, and the comparison runs only there. The agent app has its
own (`apps/agent/tests-visual`): the task picker and a session waiting for approval, at desktop
and phone widths. After an intended visual change, run the "Update screenshots" workflow,
download its artifact into `apps/`, review the image diff and commit it.

The MCP server is registered in [`.mcp.json`](.mcp.json), so Claude Code picks it up when it
opens this folder. Other clients can run `node packages/mcp/src/server.ts` over stdio.

## The audit

`npm run audit:ui` checks every component file for:

- **hard-coded-color**: hex, `rgb()` or `hsl()` instead of a `--ks-color-*` token
- **off-scale-spacing**: raw px padding, margin or gap instead of `--ks-space-*`
- **missing-focus-visible**: a `cursor: pointer` with no `:focus-visible` style
- **missing-reduced-motion**: motion with no `prefers-reduced-motion` fallback
- **clickable-non-button**: a `div` or `span` with `onClick` and no role

## Components

Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Slider, Progress, SegmentedControl, ToggleGroup, Dialog, Popover, Menu,
Tabs, CommandMenu, Tooltip, Accordion, Disclosure, Badge, Shimmer, DiffView and Toast. The overlays are built on the
platform rather than a headless library: `<dialog>` and `showModal()` for Dialog, the `popover`
attribute and CSS anchor positioning for Menu, Tooltip and Popover, and `appearance: base-select` for
Select's popup where the browser supports it. Keystone adds the parts the platform leaves out:
the menu and tabs keyboard models, controlled state, focus return, and live-region
announcements for toasts. [docs/decisions.md](docs/decisions.md) records why, what broke, and
what the tests do and don't prove.

## Generating components

`generate_component` scaffolds a TSX file and a CSS module that pass the audit by
construction: tokens only, a forwarded ref, native props spread through, and focus-visible and
reduced-motion styles for buttons and links. It returns the files instead of writing them, so
the agent (or person) still does the design work and reviews what lands.

`get_component` hands Claude the reference for an existing component: what to import, every
prop with its default and the reason it exists, and the keyboard behavior already built in. It
reads the same data the docs pages render (`packages/ui/docs/api.ts`), so the agent and the docs
can't disagree. The props tables are generated from each component's interface and JSDoc by
`node scripts/generate-props.ts`, so an editor's hover, the docs page and the agent all read the
same sentence; a test fails if the generated file is stale or a prop has no JSDoc.

## Roadmap

1. **The kit**: core components (input, select, dialog, menu, tabs, tooltip, toast), token
   docs, a "generate component" MCP tool, and a published package.
2. **An agent interface built on the kit**: a web app for working with an AI agent (plans,
   tool calls, diffs, approvals), with each interaction idea as a switchable variant. See
   [docs/phase-2-plan.md](docs/phase-2-plan.md) and the reasoning behind each variant in
   [docs/variants.md](docs/variants.md).
3. **A user study**: testers switch variants and suggest changes in the app, with consent-based
   logging. The results get published as a case study. The plan, measures and data dictionary
   are in [docs/study-plan.md](docs/study-plan.md); the instrumentation is built.
