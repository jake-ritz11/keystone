# Case study: an interface for working with a coding agent

Keystone started as a design system and became the base for an interface for working with a
coding agent. This page describes both in the order the problems came up. It covers the
questions I set out to answer, what I built, what went wrong along the way, and what is still
unproven.

## The question

Coding agents can now read a codebase, make a plan and edit files. The interfaces around them
are newer than the agents, and three design questions about them are still open. The first is
planning: should the agent start at once, or show a plan and wait for approval? The second is
visibility, meaning how much of the agent's work a person should see, down to each file it
reads and each search it runs. The third is approval. A person might decide on each edit as it
arrives, review all of them at the end, or let edits apply and undo the ones they do not want.

I did not want to argue for one answer to each question. Instead, I built an app in which each
answer is a setting, so that people can do the same task under different settings and I can
observe what they do. The reasoning behind each setting, and what I expect to happen, is in
[Interaction variants](variants.md). I wrote it before anyone had used the app, so that the
expectations could not be adjusted to fit the results.

## Constraints

I set four constraints at the start.

First, every part of the app comes from Keystone's components. When the app needed a part the
kit did not have, I added it to the kit first, with its own documentation page and tests, and
only then used it in the app. DiffView, Disclosure, SegmentedControl, Badge, Shimmer and
CommandMenu were all added this way, so the app works as the kit's most demanding user.

Second, the components are built on the browser platform instead of a component library. The
overlays use the native `<dialog>` element and the `popover` attribute, positioned with CSS
anchor positioning, and React is the only runtime dependency. The reasons, and what this cost,
are in [Decisions](decisions.md#1-built-on-the-platform-not-on-radix).

Third, a reviewer without an API key should still see the app working. Sessions can be replayed
from recordings through the same state logic and interface as live sessions, with realistic
timing. The tests and the demo both use these replays.

Fourth, the API key never reaches the browser. The server builds the prompt and the tool
definitions itself, limits the request rate, and caps the number of tokens per session and per
day. The browser sends only the conversation.

## How it is built

```
packages/tokens      colors (light, dark and high contrast), space, target sizes, type, motion
packages/ui          24 components built only from tokens
packages/agent-core  workspace, tools, diffs, session reducer, replays (no React)
apps/agent           the interface: timeline, plan, diffs, preview, variants
apps/docs            every component, every token, these write-ups
packages/mcp         lets Claude read the tokens and components, and audit its own work
```

The agent's logic contains no React. `agent-core` turns events, such as a streamed piece of
text, a tool call or an approval, into session state through a pure reducer, and its unit tests
run in Node. The tools run in the browser against an in-memory copy of a small website, so
nothing the model writes can reach a real file system. The preview shows that website in a
sandboxed iframe with scripts turned off.

Approval was simpler to build than I expected, because the agent loop runs in the browser. When
the model ends a turn with edits, the browser does not send the next request until the person
has decided. The three approval settings use this same loop and differ only in when it waits.

## Motion that carries information

An agent is slower than most software. It may work for tens of seconds before anything new
appears. A static interface makes that wait look broken, and a busy one is tiring to read next
to. Before animating anything, I therefore wrote four rules, which are
now on the [Motion](/motion) page. Every animation has to tell the person something: that
something arrived, that work is still running, or that it finished. Looping animations take two
seconds per cycle, which is slow enough to sit beside text that someone is reading. Nothing
moves under the pointer. With reduced motion turned on, the movement stops but the information
stays, shown as words, color or a still mark, and the design-system audit fails any component
that lacks this fallback.

Four examples from the app show the rules in use. A thinking status shimmers and counts seconds,
then settles into "Thought for 12s". The checks in the plan draw themselves in when a step
completes. The preview fades between versions instead of flashing white while the iframe
reloads; to do this it keeps two frames and removes the old one only after the new one has
loaded. Finally, the count on the Changes tab bumps once when an edit lands. The Motion page
lists every animation with its timing and its reduced-motion form.

## Accessibility, checked with a screen reader

The components follow the ARIA Authoring Practices patterns, and the behavior tests check their
roles, names and focus movement. Those tests do not show what a screen-reader user actually
hears, however. For that, NVDA runs in CI on Windows on every push, driven by Guidepup, and the
tests check the text NVDA speaks.

Most of what the first runs found were problems in my tests rather than in the components.
Focus moved by a script is not announced. NVDA uses the first Escape in a text field to leave
its typing mode. Guidepup at first kept only the first phrase of each announcement. The
[Decisions](decisions.md#8-a-screen-reader-in-ci) page describes each of these. After those
fixes, the tests found one real bug. When the command menu opened, NVDA read the first command
and never mentioned the search field, so a screen-reader user was not told that they could type.
I changed the menu to follow the ARIA combobox pattern more closely, so that the highlighted
command is announced only once the arrow keys move into the list. NVDA now reads "Commands,
combo box, expanded, has auto complete, editable".

NVDA also read every newly selected tab twice, and I could not find the cause in the markup. I
built a test page that added the tab pattern's attributes one at a time and had CI record what
NVDA said after each step. The repeat appeared only once `aria-controls` was added, so I removed
that attribute from Tabs. Dialogs were also read twice, but in every version of the markup I
tried, so I concluded that the repeat comes from NVDA with Chrome and documented it instead of
working around it.

One of my explanations was wrong. I thought NVDA read the top of the page after a dialog closed
because focus returned too late. Moving focus earlier did not change what NVDA read, and the
behavior comes from NVDA's own reading cursor. I reverted the change and recorded the reason.

## A response that streams, for someone who cannot watch it

An agent's reply arrives a few characters at a time. In the first version of the app the reply
was silent for screen-reader users until the status line said "Done", so they had to wait for
the end and then go back and find the text. The common alternative, making the reply a live
region, gives the screen reader every change: the example response in the docs changes between
36 and 56 times, depending on the browser, while it streams.

I read what has been measured about live regions before choosing between those two. The sources
agree on less than I expected. JAWS and Narrator treat every live region as polite, VoiceOver on
macOS skips polite regions during read-all, and `aria-busy`, which looks designed for streaming,
stops NVDA from announcing anything at all. One NVDA issue measured it: 0 of 10 updates were
announced in Chrome and 0 of 10 in Firefox. The products I could find keep the reply silent and
announce only that it started and finished. Nobody had tested the middle.

`StreamingText` is the middle. The visible text is not live, and a separate hidden region
receives whole sentences: everything up to the last sentence that has finished, as one
announcement, with an unfinished sentence said only once the stream pauses for 1.5 seconds. In
the example, the region receives 6 announcements, which are the response's 6 sentences in
order. The behavior tests prove that on a fake clock in three browser engines. In CI, NVDA spoke
the 6 sentences as 6 utterances, each once. With the text itself as the live region, NVDA began
25 utterances, each starting again from the first word. The first NVDA run reported only 2 of
the 6 sentences, and the fault was in my test: its recorder stopped listening at the first pause
in the stream. The full reasoning, the sources and the limits are in
[Streaming and screen readers](streaming.md). The claim that matters, that a sentence at a time
is easier to follow than silence, needs listeners, and no test can make it.

## Does the MCP server change what Claude builds?

The MCP server is the reason Keystone exists, and until now its value was an assertion. The
eval harness in `packages/evals` tests it. It gives Claude 8 ordinary UI tasks, such as a
confirmation dialog, a settings panel or a sign-up form, in two conditions. In both, the system
prompt says to use Keystone and its tokens. In one, Claude also has the server's
`get_tokens`, `get_component` and `audit_component` tools, answered by the same functions the
server uses. Everything else is held equal, including the model and the effort level.

The scores come from the text alone, with no model grading another model: audit findings,
components imported that the kit does not have, props a component does not have, native
elements rebuilt where the kit has a component, and the share of the components a good answer
would use. Each measure is narrow, and none of them says whether the interface is good. Runs in
which the API fell back to another model are listed and not scored, because they no longer
measure the model under test.

The harness is tested against a scripted model, so I know it scores what I meant it to score.
It has not yet run against the API. The method, what each measure misses and my expectations,
written before the first run, are in [Does the MCP server help?](evals.md). The results will go
there and here, with the number of runs behind each figure, whatever they show.

## What the tests cover

`npm run check` runs before every commit. It runs type checks, unit tests, the design-system
audit, size budgets for the published packages, the content rules, a production build, and 425
Playwright tests, each run in Chromium and WebKit: 394 for the documentation and the components,
and 31 for the agent app. They include a check of every page at 320 and 375 pixels wide for
sideways scrolling, tap-target size and text-field size. CI runs the same suite in Firefox and
runs 36 NVDA checks. Every documentation page is also checked with axe in light, dark and both
high-contrast themes. CI compares every example and overlay state in both themes with reference
screenshots rendered in the same Linux environment, so any visual change shows up as an image
difference in review. For the tests of more complicated behavior, I broke the code each test
guards and confirmed that the test failed, so that a test cannot pass without checking anything.

## What is not proven

No one has used the app yet. The [study](study-plan.md) is planned and its consent and logging
are built, but it needs the app deployed with live mode, so every expectation in
[Interaction variants](variants.md) is still untested.

Live mode has not yet been used with the real API. Its browser side is tested against recorded
stream data, which shows that the app handles the expected format but not that the format
matches what the API sends today.

The eval of the MCP server has not run against the API, so the claim that the server helps
Claude build with the system is still an expectation, not a result.

Only one screen reader is tested. NVDA with Chrome runs automatically. VoiceOver, JAWS and
Firefox are manual checks that I have not yet done, and they are listed in the
[checklist](screen-reader-checklist.md). Screen readers differ in how they read some patterns,
so the NVDA results may not hold for them.

## What I would do differently

I would put the screen reader in CI with the first component instead of the fifteenth. The
command menu bug would have been caught on the day it was written, and several of my wrong
assumptions about how NVDA reads would not have reached the code.
