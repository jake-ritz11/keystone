# How Keystone compares

Keystone is a design system built by one person, so I did not ask whether it matches Radix or
Primer. I asked instead which of their practices it should have, which it deliberately leaves
out, and where it does something they do not. I compared it with five component libraries
(Radix Primitives, React Aria Components, Base UI, shadcn/ui, Ark UI), six design systems
(Primer, Carbon, Spectrum 2, Geist, Polaris, Atlassian) and three agent UI kits (Vercel AI
Elements, assistant-ui, CopilotKit), as they stood in October 2026.

The comparison found gaps in Keystone, and most of those from the first round are now closed.
Each section says what changed as a result.

## Components

All five libraries ship Checkbox, Switch, RadioGroup, Slider, Progress, a general Popover,
Toggle and Accordion. Keystone had none of the first three, which is the gap a reviewer notices
first, so I built them. They are native inputs drawn with tokens, in the same way that Select
uses a native select. The browser therefore handles the click on the label, the Space and arrow
keys, form submission and required validation. Building on native radios showed one browser
difference that is worth documenting. Safari's radio groups stop at the last option, whereas
Chrome and Firefox wrap. Slider showed another. In right-to-left text every engine puts the
minimum on the right, but the Left arrow key raises the value in Chromium, which follows the
mirrored track, and lowers it in Safari.

| Component | Libraries with it | Keystone |
| --- | --- | --- |
| Checkbox, Switch, RadioGroup | all five | Built in this round |
| Accordion | all five | Built in the second round, for real headings and arrow keys; Disclosure stays for single sections |
| Popover | all five | Public in the second round, as a non-modal dialog on the same anchoring that Menu and Tooltip use |
| Slider, Progress | all five | Built in the second round, on `<input type="range">` and `<progress>` |
| Toggle group | all five | Built in the second round. SegmentedControl stays for exactly-one choices |
| Combobox | four | Inside CommandMenu only |
| Date and number fields | two or three | Not planned. React Aria's localized parsing is the bar, and matching it would be a project of its own |

## Conventions

The libraries agree on a few API conventions. Keystone already follows the most important of
them, which is `value`, `defaultValue` and `onValueChange` (and `open` / `onOpenChange`) on
every stateful component. Checkbox and Switch follow the same pattern with `onCheckedChange`.

Keystone deliberately does not follow two other conventions. The first is the `asChild` or
`render` prop, with which Radix and Base UI let a developer swap the rendered element.
Keystone's components are the native element, so there is rarely another element to want. The
cost shows up in Tooltip, which wraps its trigger instead.

The second is the `data-state` hooks. Radix and Base UI expose state as data attributes for
styling. Keystone has few of them, because it mostly styles native state directly (`:checked`,
`:open`, `[open]`), which needs no attribute. This is worth revisiting if people style the kit
from outside.

## Design-system infrastructure

The mature systems share infrastructure that Keystone lacked. In this round I added the four
parts with the most to say about how a system is run.

The first is tokens in two tiers. Primer and Spectrum separate raw palette values from semantic
roles. Keystone's colors were one flat list. Now a palette holds every raw color, and the
semantic tokens point into it for each theme. The audit fails any component that reaches past
the semantic tier to the palette.

The second is high contrast. Primer ships high-contrast themes as small override files, and
Spectrum models contrast as its own axis. Keystone now does both. `prefers-contrast: more` (or
`data-contrast`) applies a set of overrides to either theme, and axe runs on every page in all
four combinations.

The third is the W3C token format. The DTCG format reached its first stable version in October
2025. The published package now ships `tokens.json` in that format, with the two tiers kept as
references, alongside the CSS and TypeScript.

The fourth is an honest accessibility status. Carbon labels each component with how it was
tested. Keystone's pages now do the same, and the labels are read from the specs and the
screen-reader checklist at build time instead of being written by hand. The first build showed
that Select had no behavior spec, and it has one now.

I then added a fifth, visual regression screenshots, which were the most common guardrail that
Keystone was missing. Every example on every component page, along with the open menu, tooltip,
dialog, command menu, toast and focus ring, is compared in both themes against baselines
rendered in CI's Linux image. The list comes from the component registry, so a new page is
covered without a new test.

One more change came from looking at how the libraries document props. React Aria generates its
prop tables from the TypeScript types, so they cannot drift from the code. Keystone's tables were
written by hand, with a test that checked only the names. They are now generated from each
interface and its JSDoc, so the editor hover, the docs page and the MCP server read the same
sentence, and a test fails if a prop has no description. TypeScript 7 has no JavaScript compiler
API, so a small parser reads the one shape in which Keystone's components are written, and its
tests pin that shape down.

Building these parts found two real bugs that the existing tests had missed. First, field
borders failed WCAG 1.4.11. A text field's resting outline had a contrast of 1.34:1 against the
page, and WCAG asks for 3:1 for the visual that identifies a control. There is now a
`borderControl` token at 3:1 or more, and a unit test checks every text and control pair in
every theme against its minimum.

Second, right-to-left mirroring was off in the apps, and nothing reported it. With no browser
targets declared, the CSS build compiled `:dir(rtl)` into a list of right-to-left *languages*,
which a `dir` attribute never matches. As a result, Disclosure's chevron, Shimmer's sweep and the
agent app's plan meter did not mirror. Declaring the browser targets that the kit already needs
(for popover and `@starting-style`) fixed all three, and a spec now covers it.

Content guidelines were also missing. Atlassian publishes voice, tone and per-component copy
guidance, and the agent app's copy for tool states, approvals and errors was where guidelines
would matter most. They are now written up in [Content guidelines](content-guidelines.md), and a
test checks the rules that can be checked mechanically. Writing them showed that the app's error
messages did not say what to do next, and those messages have since been rewritten.

Some infrastructure is still missing. In rough order of value, the first is changesets and a
changelog, which matter once the packages are published. Density modes, a Figma kit and an icon
set come after that, and are of lower value for a system with one person behind it.

## Agent interfaces

Compared with the agent UI kits, the agent app covers the patterns that are about trust and
control, and has fewer of the patterns that are about chat.

| Pattern | AI Elements | assistant-ui | CopilotKit | Keystone |
| --- | --- | --- | --- | --- |
| Tool calls with status | ✓ | ✓ | ✓ | ✓ |
| Approval before an edit | ✓ | ✓ | ✓ | ✓, as a diff with reasons |
| Plan or task list | ✓ | ✓ | partial | ✓, with progress |
| Diff review | partial | ✓ | none | ✓, with three approval modes |
| Live preview | ✓ | ✓ | none | ✓ |
| Thinking status | ✓ | ✓ | unverified | ✓, timed |
| Sources, citations | ✓ | ✓ | none | ✓, as file and line references that open the file there |
| Suggestions, branching, regenerate | ✓ | ✓ | ✓ | none |
| Attachments in the composer | ✓ | ✓ | ✓ | none |

The kits' citations point at web pages. For a coding agent the sources are the files, so
Keystone's citations are file references. When the agent writes `index.html:40`, or only a file
name, the text becomes a link that opens the Files tab with that line marked and focused. Only
files that exist become links, so a misspelled name that the agent is describing ("abuot.html")
stays as text. The system prompt asks the agent for `path:line` wherever a claim can be checked.

The kits ship components, and none of them treats the interaction itself as an open question.
This project is trying to find out how those components should behave. Keystone's three variants
(planning, visibility and approval) are settings, so the same task can be run under each one,
and the [study](study-plan.md) is set up to measure which ones people prefer.

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
