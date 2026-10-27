# How Keystone compares

Keystone is one person's design system, so the useful question isn't whether it matches
Radix or Primer. It's which of their practices it should have, which it deliberately skips,
and where it does something they don't. This page answers that against five component
libraries (Radix Primitives, React Aria Components, Base UI, shadcn/ui, Ark UI), six design
systems (Primer, Carbon, Spectrum 2, Geist, Polaris, Atlassian) and three agent UI kits (Vercel
AI Elements, assistant-ui, CopilotKit), as they stood in October 2026.

The comparison turned up gaps, and most of the first round is now closed. Each section says
what changed because of it.

## Components

Every one of the five libraries ships Checkbox, Switch, RadioGroup, Slider, Progress, a general
Popover, Toggle and Accordion. Keystone had none of the first three, which is the gap a
reviewer notices first, so they're built: native inputs drawn with tokens, the same way Select
uses a native select. The browser supplies the label click, Space, arrow keys, form submission
and required validation. Building on native radios surfaced one difference worth documenting:
Safari's radio groups stop at the last option where Chrome and Firefox wrap. Slider found
another: in right-to-left text every engine puts the minimum on the right, but Chromium's Left
arrow raises the value (it follows the mirrored track) while Safari's lowers it.

| Component | Libraries with it | Keystone |
| --- | --- | --- |
| Checkbox, Switch, RadioGroup | all five | Built in this round |
| Accordion | all five | Disclosure covers one section; exclusive groups use `<details name>` |
| Popover | all five | Built internally for Menu and Tooltip; not yet a public component |
| Slider, Progress | all five | Built in the second round, on `<input type="range">` and `<progress>` |
| Toggle group | all five | Built in the second round. SegmentedControl stays for exactly-one choices |
| Combobox | four | Inside CommandMenu only |
| Date and number fields | two or three | Not planned. React Aria's localized parsing is the bar, and matching it is its own project |

## Conventions

The libraries agree on a few API conventions, and Keystone already follows the most
important one: `value`, `defaultValue` and `onValueChange` (and `open` / `onOpenChange`) on
every stateful component. Checkbox and Switch follow the same pattern with `onCheckedChange`.

Two it doesn't follow, on purpose:

- **No `asChild` or `render` prop.** Radix and Base UI let you swap the rendered element.
  Keystone's components are the native element, so there's rarely another element to want.
  The cost shows up in Tooltip, which wraps its trigger instead.
- **Few `data-state` hooks.** Radix and Base UI expose state as data attributes for styling.
  Keystone mostly styles native state directly (`:checked`, `:open`, `[open]`), which needs
  no attribute. It's worth revisiting if people style the kit from outside.

## Design-system infrastructure

The mature systems share infrastructure Keystone lacked. This round added the four with the
most to say about how a system is run:

- **Tokens in two tiers.** Primer and Spectrum separate raw palette values from semantic
  roles. Keystone's colors were one flat list; now a palette holds every raw color and the
  semantic tokens point at it per theme. The audit fails any component that reaches past the
  semantic tier.
- **High contrast.** Primer ships high-contrast themes as small override files, and Spectrum
  models contrast as its own axis. Keystone now does both: `prefers-contrast: more` (or
  `data-contrast`) applies a set of overrides to either theme, and axe runs on every page in
  all four combinations.
- **The W3C token format.** The DTCG format reached its first stable version in October
  2025. The published package now ships `tokens.json` in it, with the two tiers kept as
  references, alongside the CSS and TypeScript.
- **Honest accessibility status.** Carbon labels each component with how it was tested.
  Keystone's pages now do too, and the labels are read from the specs and the screen-reader
  checklist at build time rather than written by hand. The first build showed Select had no
  behavior spec, and it has one now.

A fifth followed: **visual regression screenshots**, the most common guardrail Keystone was
missing. Every example on every component page, and the open menu, tooltip, dialog, command menu,
toast and focus ring, are compared in both themes against baselines rendered in CI's Linux image.
The list comes from the component registry, so a new page is covered without a new test.

Building these found two real bugs the existing tests had missed:

1. **Field borders failed WCAG 1.4.11.** A text field's resting outline was 1.34:1 against
   the page. WCAG asks 3:1 for the visual that identifies a control. There's now a
   `borderControl` token at 3:1 or more, and a unit test checks every text and control pair
   in every theme against its minimum.
2. **Right-to-left mirroring was silently off in the apps.** With no browser targets declared,
   the CSS build compiled `:dir(rtl)` into a list of right-to-left *languages*, which a `dir`
   attribute never matches. Disclosure's chevron, Shimmer's sweep and the agent app's plan
   meter didn't mirror. Declaring the targets the kit already needs (for popover and
   `@starting-style`) fixed all three, and a spec now covers it.

Still missing, in rough order of value:

- **Changesets and a changelog.** These matter once the packages are published.
- **Content guidelines.** Atlassian publishes voice, tone and per-component copy guidance. The
  agent app's copy (tool states, approvals, errors) is where this would pay off first.
- **Density modes, a Figma kit, an icon set.** Lower value for a one-person system.

## Agent interfaces

Next to the agent UI kits, the agent app covers the parts that are about trust and control,
and is thinner on the parts that are about chat:

| Pattern | AI Elements | assistant-ui | CopilotKit | Keystone |
| --- | --- | --- | --- | --- |
| Tool calls with status | ✓ | ✓ | ✓ | ✓ |
| Approval before an edit | ✓ | ✓ | ✓ | ✓, as a diff with reasons |
| Plan or task list | ✓ | ✓ | partial | ✓, with progress |
| Diff review | partial | ✓ | none | ✓, with three approval modes |
| Live preview | ✓ | ✓ | none | ✓ |
| Thinking status | ✓ | ✓ | unverified | ✓, timed |
| Sources, citations | ✓ | ✓ | none | none |
| Suggestions, branching, regenerate | ✓ | ✓ | ✓ | none |
| Attachments in the composer | ✓ | ✓ | ✓ | none |

What none of the kits do is treat the interaction itself as an open question. Keystone's three
variants (planning, visibility, approval) are switches, so the same task can be run under
each one. The [study](study-plan.md) is set up to measure which ones people prefer. The kits
ship components; this project is trying to find out how they should behave.

## Sources

- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction),
  [React Aria](https://react-aria.adobe.com/), [Base UI](https://base-ui.com/react/overview/quick-start),
  [shadcn/ui](https://ui.shadcn.com/docs/components), [Ark UI](https://ark-ui.com/docs/overview/getting-started)
- [Primer primitives](https://github.com/primer/primitives),
  [Primer component lifecycle](https://primer.style/guides/component-lifecycle),
  [Carbon accessibility status](https://carbondesignsystem.com/components/overview/accessibility-status),
  [Spectrum design data](https://opensource.adobe.com/spectrum-design-data/spec/dimensions),
  [Atlassian voice and tone](https://atlassian.design/foundations/content/voice-tone)
- [DTCG first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [AI Elements](https://elements.ai-sdk.dev/), [assistant-ui](https://www.assistant-ui.com/elements),
  [CopilotKit](https://docs.copilotkit.ai/reference)
