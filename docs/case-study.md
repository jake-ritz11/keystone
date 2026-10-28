# Case study: an interface for working with a coding agent

Keystone started as a design system and became the ground an agent interface is built on. This
is the story of both, in the order the problems showed up: what I set out to answer, what I
built, what went wrong, and what is still unproven.

## The question

Coding agents now do real work: they read a codebase, plan, and edit files. The interfaces
around them are still young. Three questions keep coming up, and nobody has settled them:

- **Planning.** Should the agent act at once, or show a plan and wait?
- **Visibility.** How much of its work (every file read, every search) should you see?
- **Approval.** When does a person decide on an edit: each one, all at the end, or never
  unless they undo it?

I didn't want to argue for one answer. I wanted an app where each answer is a switch, so
people can try the same task under different answers and I can watch what they do. The
reasoning for each switch, with what I expect to happen, is in
[Interaction variants](variants.md), written before anyone has used it.

## Constraints I chose

- **Build the kit first.** Every part of the app comes from Keystone's components, and a part
  the app needs goes into the kit first, with its own docs page and tests. DiffView,
  Disclosure, SegmentedControl, Badge, Shimmer and CommandMenu all arrived this way. The app is
  the kit's hardest customer.
- **Platform over libraries.** Overlays are the native `<dialog>` and `popover`, positioned
  with CSS anchor positioning. React is the only runtime dependency. Why, and what it cost,
  is in [Decisions](decisions.md#1-built-on-the-platform-not-on-radix).
- **A reviewer without an API key sees the real thing.** Sessions can be replayed from recordings
  through the same reducer and UI as live ones, with realistic timing. The tests, the demo and
  anyone reading this use replays.
- **The key never reaches the browser.** The server builds the prompt and tools itself, rate
  limits, and caps tokens per session and per day. The client sends only the conversation.

## How it's built

```
packages/tokens      colors (light and dark), space, type, motion
packages/ui          15 components built only from tokens
packages/agent-core  workspace, tools, diffs, session reducer, replays (no React)
apps/agent           the interface: timeline, plan, diffs, preview, variants
apps/docs            every component, every token, these write-ups
packages/mcp         lets Claude read the tokens and components, and audit its own work
```

The agent's logic has no React in it. `agent-core` turns events (a streamed text delta, a tool
call, an approval) into session state through a pure reducer, and its unit tests run in Node.
The tools run in the browser against an in-memory copy of a small website, so nothing the
model writes touches a real filesystem. The preview renders that website in a sandboxed iframe
with scripts off.

Approval turned out to be simple once the loop lived in the client: when a turn ends with
edits, the client just doesn't send the next request until the person decides. All three
approval modes are the same loop with a different rule for when to wait.

## Motion that carries information

An agent is slow in a way most interfaces aren't. It works for tens of seconds, then
something lands. Static UI makes that feel broken; busy UI makes it tiring to read beside. So
I wrote rules before animating anything, now on the [Motion](/motion) page:

- Every animation says something: it arrived, it's still running, or it finished.
- Loops take a two-second cycle, calm enough to sit next to text you're reading.
- Nothing moves under the pointer.
- Reduced motion keeps the meaning. Movement goes; the state stays, as words, color or a
  still mark. The audit fails any component without that fallback.

Some examples from the app:

- A thinking status shimmers and counts seconds, then settles into "Thought for 12s".
- The plan's checks draw themselves in when a step completes.
- The preview dissolves between versions instead of flashing white while the iframe reloads.
  Two frames are kept and the old one is dropped only once the new one has loaded.
- The Changes count bumps when an edit lands.

Each pattern, its timing and its reduced-motion form is one row of a table, so none of it is
decoration I'd have to defend later.

## Accessibility, checked by a real screen reader

The components were built to the ARIA patterns and the behavior tests prove the roles,
names and focus moves are right. That still isn't proof of what someone hears. So NVDA runs in
CI on Windows on every push, driven by Guidepup, and the tests assert on its actual speech.

The first runs mostly found problems with my tests. Focus placed by script is silent, NVDA
keeps the first Escape in a text field for itself, and Guidepup kept only the first phrase of
each response. The [Decisions](decisions.md#8-a-screen-reader-in-ci) page lists each one.
Once the tests were honest, they found a real bug: opening the command menu read the first
command and never mentioned the search field, so a screen-reader user wasn't told they could
type. The fix follows the ARIA pattern more closely: the highlighted command isn't announced
until the arrow keys move into the list. NVDA now reads "Commands, combo box, expanded, has
auto complete, editable".

When the cause wasn't obvious, I stopped guessing and measured. NVDA read every newly
selected tab twice. A throwaway page built the tab pattern up one attribute at a time and CI
recorded NVDA on each: only `aria-controls` doubled it, so Tabs dropped it. Dialogs read twice
too, but in every variant tried, so that one is NVDA's and is written down rather than worked
around.

Not every theory held. I thought NVDA read the top of the page after a dialog closed because
focus came back too late. I moved it and NVDA still did it: the cause is NVDA's own reading
cursor. The change was reverted and the reason is written down.

## What the tests cover

`npm run check` runs on every commit: type checks, unit tests, the design-system audit, size
budgets for the published packages, the content rules, a production build, and 137 Playwright
behavior tests (111 for the components, 26 for the agent app) in Chromium and WebKit locally,
with Firefox and NVDA in CI. Every docs page also passes axe in light, dark and both
high-contrast themes. CI compares 114 screenshots of every example and overlay state, in both
themes, against baselines rendered in its own Linux image, so a change to how something looks
shows up as an image diff in review. Specs for tricky behavior are checked by breaking the code
they guard and watching them fail, so they can't pass by accident.

## What isn't proven

- **Nobody has used it yet.** The [study](study-plan.md) is planned and its consent and
  logging are built, but it needs the live app deployed. Every expectation in
  [Interaction variants](variants.md) is still a guess.
- **Live mode hasn't met the real API.** Its client path is tested against recorded stream
  frames; the first real session is still ahead.
- **One screen reader.** NVDA with Chrome is automated. VoiceOver, JAWS and Firefox are
  manual checks not yet done, listed in the [checklist](screen-reader-checklist.md).

## What I'd do differently

I'd put the screen reader in CI from the first component, not the fifteenth. The command menu
bug would have been caught the day it was written, and several of my assumptions about how
NVDA reads things would never have reached the code.
