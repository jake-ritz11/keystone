# Keystone

Keystone is a token-driven React design system with an MCP server and Claude skills, so that
Claude can build components from the system and check its own work against it.

| Package | What it is |
| --- | --- |
| [`packages/tokens`](packages/tokens) | Design tokens for color (light, dark and high contrast), space, target size, radius, type and motion. Every component reads its values from here |
| [`packages/ui`](packages/ui) | 23 React components, styled only with tokens, each with keyboard support, a reduced-motion fallback and both themes |
| [`packages/mcp`](packages/mcp) | MCP server: `get_tokens`, `get_component`, `audit_component`, `generate_component`, plus a CLI audit |
| [`apps/docs`](apps/docs) | Next.js docs site and component playground |
| [`apps/agent`](apps/agent) | The agent interface (phase 2): work with a coding agent, with switchable interaction variants |
| [`packages/agent-core`](packages/agent-core) | The agent's logic, without React: sandboxed workspace, tools, diffs, session reducer, replays |
| [`.claude/skills`](.claude/skills) | Claude skills that teach the rules (`keystone-components`) |

## Run it

Keystone requires Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev        # docs site at http://localhost:3000
npm run dev:agent  # agent app at http://localhost:3001 (replays; no API key needed)
npm run check      # typecheck, unit tests, audit, content rules, package build and size budgets, builds, behavior and phone-width tests
```

For live sessions in the agent app, copy `apps/agent/.env.example` to `apps/agent/.env.local`
and set `ANTHROPIC_API_KEY`. The key stays on the server. The browser sends only the
conversation, and the route builds the prompt and the tools itself, limits the request rate and
enforces a daily token budget.

`npm run build:packages` compiles `@keystone-ui/tokens` and `@keystone-ui/ui` into each
package's `dist/`. The output is ESM with type declarations, plus `tokens.css` and a single
`styles.css` with scoped class names, so the published packages work in any React setup without
extra configuration. Smoke tests render every component from the built bundle and type-check a
consumer against the built declarations. Publish with `npm publish packages/ui/dist`.

The behavior tests (`apps/docs/tests`) use Playwright to drive the production docs build in
Chromium and WebKit. They cover keyboard models, focus return, ARIA wiring, light dismiss, and
the WCAG timing and hover rules for tooltips and toasts. They run in real browser engines
instead of jsdom because the components are built on `<dialog>`, `popover` and anchor
positioning, which jsdom does not implement. The first run needs
`npx -w apps/docs playwright install chromium webkit`. CI runs `check` and the Firefox tests on
every push. Firefox is left out of the local `check` because it does not launch on the Windows
machine I built this on. To run it, use `npm run test:e2e:firefox -w apps/docs`.

The visual regression tests (`apps/docs/tests-visual`) take a screenshot of every example on
every component page, and of the open states of the overlays, in light and dark, and compare
them with committed baselines. Fonts render differently on each operating system, so the
baselines come from the same Linux Playwright image that CI uses, and the comparison runs only
there. The agent app has its own visual tests (`apps/agent/tests-visual`), which cover the task
picker and a session waiting for approval at desktop and phone widths. After an intended visual
change, run the "Update screenshots" workflow, download its artifact into `apps/`, review the
image diff and commit it.

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

Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Slider, Progress,
SegmentedControl, ToggleGroup, Dialog, Popover, Menu, Tabs, CommandMenu, Tooltip, Accordion,
Disclosure, Badge, Shimmer, DiffView and Toast.

The overlays are built on the browser platform instead of a headless library. Dialog uses
`<dialog>` and `showModal()`. Menu, Tooltip and Popover use the `popover` attribute and CSS
anchor positioning, and Select uses `appearance: base-select` for its popup where the browser
supports it. Keystone adds the parts the platform leaves out, which are the keyboard models for
the menu and tabs, controlled state, focus return, and live-region announcements for toasts.
[docs/decisions.md](docs/decisions.md) records the reasons, what broke, and what the tests do
and do not prove.

## Generating components

`generate_component` scaffolds a TSX file and a CSS module that pass the audit by
construction. The files use tokens only, forward a ref, spread native props through, and include
focus-visible and reduced-motion styles for buttons and links. The tool returns the files
instead of writing them, so the agent or person using it still does the design work and reviews
what is added.

`get_component` gives Claude the reference for an existing component. The reference lists what
to import, every prop with its default and the reason it exists, and the keyboard behavior that
is already built in. The tool reads the same data that the docs pages render
(`packages/ui/docs/api.ts`), so the agent and the docs cannot disagree. The props tables are
generated from each component's interface and JSDoc by `node scripts/generate-props.ts`, so an
editor's hover text, the docs page and the agent all read the same sentence for each prop. A
test fails if the generated file is stale or if a prop has no JSDoc.

## Roadmap

1. **The kit** is built. It has 23 components, two-tier tokens with high contrast, the MCP
   server, and docs whose props tables are generated from the source. What remains is to
   publish the packages to npm and to use changesets for the changelog from then on.
2. **An agent interface built on the kit** is built. It is a web app for working with an AI
   agent (plans, tool calls, diffs, approvals, file references you can follow), with each
   interaction idea as a switchable variant. See [docs/phase-2-plan.md](docs/phase-2-plan.md),
   and the reasoning behind each variant in [docs/variants.md](docs/variants.md). What remains
   is to deploy it with live mode switched on.
3. **A user study** has not started. Testers will switch variants and suggest changes in the
   app, with consent-based logging, and the results will be published as a case study. The
   plan, measures and data dictionary are in [docs/study-plan.md](docs/study-plan.md), and the
   instrumentation is built. The study needs the deployed app.
