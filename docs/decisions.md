# Decisions

This is a record of the calls behind Keystone's components and how they held up: what was decided, what
broke, what the tests proved, and what they didn't. It covers the phase 1 components (Input,
Select, Dialog, Menu, Tabs, Tooltip, Toast) and the test setup around them.

## 1. Built on the platform, not on Radix

**The call.** The overlays use what browsers now ship: `<dialog>` with `showModal()` for
[Dialog](../packages/ui/src/dialog/Dialog.tsx), the `popover` attribute for
[Menu](../packages/ui/src/menu/Menu.tsx), [Tooltip](../packages/ui/src/tooltip/Tooltip.tsx) and
[Toast](../packages/ui/src/toast/Toast.tsx), CSS anchor positioning to tie popovers to their
triggers, `appearance: base-select` for [Select](../packages/ui/src/select/Select.tsx)'s popup,
and `@starting-style` for entry transitions. The only runtime dependency is React.

**Why.** A headless library like Radix would have been faster to wire up and is battle-tested. But
the browser now provides the hard parts of an overlay itself: the top layer, an inert
background, a focus trap, Escape, and light dismiss. Rebuilding those in JavaScript means
more code to ship and more ways to drift from what the platform does. Building on the platform
also leaves less to hide. Everything Keystone adds is code you can read in this repo:

- the menu keyboard model: arrows, Home/End, typeahead, skipping disabled items;
- the tabs keyboard model, with automatic and manual activation;
- controlled state, so React stays the source of truth (`open` drives `showModal()`; Escape
  calls `onOpenChange(false)` instead of closing the element behind React's back);
- focus return;
- live-region announcements for toasts, and the timing rules for tooltips and toasts.

**The costs.**

- *Newer features.* Anchor positioning and `base-select` aren't everywhere yet. Popovers fall
  back to a one-shot JavaScript placement
  ([`placeFallback`](../packages/ui/src/popover/anchor.ts)). Select falls back to the operating
  system's picker, which is still a fully working select. Neither engine tested so far
  needs either fallback, so the placement maths is covered by
  [unit tests](../packages/ui/src/popover/anchor.test.ts) rather than in a browser.
- *Behavior differs between browsers in small ways.* Section 3 is an example.
- *Cloning triggers broke under server components.* The first Tooltip used `cloneElement` to
  add ARIA attributes to its trigger. A trigger passed in from a React Server Component arrived
  as a lazy reference whose props couldn't be read, and the page crashed. Menu and Tooltip now
  wrap the trigger in a `display: contents` span and set the attributes on the real element
  ([`wireTrigger`](../packages/ui/src/popover/anchor.ts)). This is less elegant than cloning,
  but it works whatever the caller passes in.

## 2. The toast you could see but not use

**What happened.** Toasts render in a manual popover. Showing it again after a modal opens moves
it to the top of the top layer, so a toast appears above an open dialog's backdrop. In the browser it
looked right. But clicking the toast's dismiss button closed the dialog behind it.

**Why.** A modal dialog makes everything outside it inert, and being visually on top doesn't
change that. `document.elementFromPoint` at the dismiss button returned the `<dialog>`, not the
button. The click went to the dialog element, and Dialog read a click on its own element as a backdrop click, so it closed. The same inertness
means a live region outside the modal may not be announced by screen readers.

**The fix.** While a modal is open, the whole toast layer, live regions included, is portalled
into the topmost `dialog:modal`. It moves back out when that dialog fires `close`. Moving the
layer remounts the live regions, so an announcement waits 100 ms for the new region to be in
the accessibility tree. A toast that you can see but can't click or hear is worse than no
toast. The behavior test "over a modal dialog it can be used without closing the dialog" pins
it down.

**The lesson.** "Visible" and "usable" are different checks. The screenshot passed; the
click failed.

## 3. Safari doesn't focus what you click

**What happened.** The first WebKit run failed two Dialog tests: after closing, focus didn't
return to the button that opened the dialog. Chromium passed them.

**Why.** In Safari, clicking a button doesn't focus it. So when the dialog opened,
`document.activeElement` was `<body>`, and that's where Dialog saved focus to return. A probe run in both engines
confirmed this: after a mouse open and Escape, focus landed on `BUTTON` in Chromium and `BODY`
in WebKit. Opening with the keyboard worked in both, because a keyboard user's trigger already
has focus.

**The fix** ([`05cd30e`](https://github.com/jake-ritz11/keystone/commit/05cd30e)). Dialog keeps a
capture-phase `pointerdown` listener on the document that remembers the last control pressed.
On open it uses the focused element if there is one, and the last pressed control otherwise.
The cost is a document-level listener installed when the module loads, which is a global side
effect. It's small and passive, and it's the price of getting focus return right in Safari for
mouse users.

## 4. Tests run in real browsers

**The call.** Behavior tests are Playwright specs in [`apps/docs/tests`](../apps/docs/tests).
They run against the production build of the docs site, in Chromium and WebKit, as the last
step of `npm run check`, and CI also runs them in Firefox. There are 34 specs per engine.

**Why not jsdom.** jsdom implements neither `showModal()`, nor `popover`, nor anchor positioning.
Tests there would exercise polyfills and mocks, which would prove the mocks work. The point of
building on the platform is that the platform does the work, so the platform has to be in the
test.

**How they're set up.**

- The docs page's demos are the test fixtures, so every state on the docs page is a state under
  test.
- Assertions go through roles and accessible names (`getByRole("menu", { name: "Actions" })`),
  so the ARIA wiring is checked by every test, not just the ones about it.
- The tests run with reduced motion on, and the toast timers run on Playwright's fake clock.
  That makes "dismisses after 5 s" and "hovering pauses the timer" exact rather than flaky.

**What it cost.** Browser downloads, and about 20 seconds per run. Two test-side surprises: Next.js
ships its own `role="alert"` route announcer, so toast assertions filter by text; and
Playwright won't click an `aria-disabled` item without `force`, which is exactly the case under
test.

## 5. What the mutation checks showed

A test that passes proves little until you've seen it fail. Two deliberate breakages:

| Mutation | Expected | Result |
| --- | --- | --- |
| Remove Menu's own focus-return line | Focus-return tests fail | **All 9 Menu tests still passed** |
| Stop Menu skipping disabled items | Arrow-key test fails | Failed, as it should |

The first result is the interesting one. Chromium already returns focus to the previously focused element when a popover that
contains focus closes. Keystone's own `trigger.focus()` in
[Menu](../packages/ui/src/menu/Menu.tsx) is redundant there. The test checks the behavior, which
holds either way, so it can't tell whether the line does anything. The line stays as a backstop
for browsers that don't do this, but it's effectively untested code, and it's recorded here rather than
left looking covered.

The Safari bug in section 3 worked as an unplanned mutation: one real platform difference, and
two tests caught it straight away.

**Takeaways.** Building on the platform means the platform does more than you think, so some of
your code turns out to be insurance. And a passing test only tells you something once you've
seen it fail.

## 6. Nothing moves under the pointer

Content that jumps while you're aiming at it causes misclicks. Three places did it, and a
review found all three:

| Where | What moved | Fix |
| --- | --- | --- |
| Dialog | Locking scroll hid the scrollbar, so the page widened and centered content slid sideways (7px in the test). | While locked, the scrollbar's gutter stays reserved (`scrollbar-gutter: stable`), but only if the page had a scrollbar, so short pages don't gain an empty gutter instead. No JavaScript measuring. |
| Input and Select | A validation error appeared under a field on blur, pushing down the field you were clicking. | One message line per field, reserved by default. An error takes the hint's place instead of adding a line; the hint stays in the field's description, visually hidden. Errors no longer disappear when the field is focused. |
| Button | The loading spinner was added before the label, widening the button. | The spinner overlays the content, which stays laid out at zero opacity, so the width can't change and the accessible name stays. |

[`layout.spec.ts`](../apps/docs/tests/layout.spec.ts) measures each one before and after. The
dialog test needed real scrollbars: headless Chromium hides them by default, which made the
first version pass even with the fix removed. Playwright's `--hide-scrollbars` flag is now
dropped for Chromium, and the test skips (saying why) in WebKit, which draws overlay scrollbars
that take no space. With the fix removed, it fails.

## 7. A second pair of eyes

After the layout fixes, an independent review of the kit, done without seeing my reasoning,
found 13 more defects. All were real. The ones worth remembering:

- **Animation re-layout.** Dialog and Menu scoped their layout to `[open]` / `:popover-open`.
  During the exit fade the element is no longer open but still displayed, so its contents
  re-laid out side by side for 200ms. Layout now lives on the base rule and only `display`
  toggles. Exits are plain fades; entrances rise without scaling, since scaled text blurs.
- **Precedence.** Hovering an invalid field turned its red border grey, because the hover rule
  out-ranked the invalid one.
- **Escape leaking.** Escape on a tooltip inside a dialog closed the dialog too. The tooltip
  now handles the key in the capture phase and stops it.
- **Two highlights in a menu.** Hover and keyboard focus painted separately, so two rows could
  look selected. The pointer now moves focus, so there's one highlight.
- **Touch, RTL and overflow.** Hover styles stuck after a tap on phones (now behind
  `@media (hover: hover)`). Physical left/right properties broke right-to-left layouts, and
  the tab arrow keys didn't mirror. Long tab lists, menus, titles and labels could push past
  the screen. Toasts jumped when one arrived or left; they now glide into place.
- **Leaking page CSS.** The docs site's global `th`/`td` rules restyled DiffView's table. Kit
  components now set their own table boxes explicitly, and the docs scope their table styles.

Each behavioral fix has a spec in [`polish.spec.ts`](../apps/docs/tests/polish.spec.ts) or
[`layout.spec.ts`](../apps/docs/tests/layout.spec.ts).

## 8. A screen reader in CI

**The call.** The scripted NVDA pass was meant to be done by hand. Most of it now runs on every
push instead: [Guidepup](https://www.guidepup.dev) starts a real NVDA on a Windows runner,
Playwright drives Chrome, and [`tests-sr/nvda.spec.ts`](../apps/docs/tests-sr/nvda.spec.ts)
asserts on what NVDA said. It's a separate workflow from `check`: slower (about five minutes),
and dependent on speech timing.

**Getting honest results took four rounds.**

- Focus that Playwright sets from outside isn't announced, so a test that calls `focus()` hears
  silence and proves nothing. Every move now goes through NVDA as a key press; to reach an
  element, the test focuses the one before it and presses Tab.
- Guidepup keeps only the first phrase after a key by default, which dropped the newly focused
  element whenever a key both changed state and moved focus. Opening a menu read as just
  "expanded". The tests now capture everything.
- NVDA keeps the first Escape pressed in a text field for itself, to leave focus mode. The
  dialog never saw it. Real NVDA users press it twice, so the test does too.
- Some expectations were mine, not NVDA's. NVDA leaves out "menu item" inside a menu, and reads
  `role="alertdialog"` in Chrome as "dialog". The specs now say so instead of failing on it.

**A theory that didn't hold.** After a dialog closes, NVDA reads "Skip to content" before it
reaches the opener. I assumed focus came back a task too late and moved the `focus()` call next
to `close()`. NVDA still read it. The cause is NVDA's browse-mode cursor: it was inside the
dialog, the dialog left, and the cursor reset to the top of the page before following focus.
The change was reverted; the spec records why.

**Two double announcements, one fixed.** NVDA read the newly selected tab twice, and every
dialog's name and description twice on open. Rather than guess, a throwaway page put the
candidate fixes side by side, and CI recorded what NVDA said for each:

- *Tabs.* My first theory was order: focus moved, then the tab became selected, and NVDA
  announced both. Selecting first didn't change a thing. A second run took the tab pattern
  apart one attribute at a time: swapping panels, naming them, making them focusable, all read
  once. Every variant with `aria-controls` read twice. NVDA doesn't use `aria-controls`
  otherwise, so Tabs leaves it out; the panel is still named by its tab, and the spec counts
  the announcement. The cost is JAWS's shortcut to a controlled panel.
- *Dialogs.* Five native dialog variants all read twice: with and without a description, with
  focus placed by the `autofocus` attribute, by script in the same task, by script a frame
  later, and by the browser's own default. Nothing in the markup changes it, and others report
  the same with ARIA dialogs, so it's NVDA's behavior with Chrome. Dialog stays as it is;
  swapping the native element for a `div` would give up the top layer and the inert
  background to chase a screen reader quirk. The results are in the
  [checklist](screen-reader-checklist.md#results).

## What isn't proven yet

- **Firefox locally.** Firefox passes all 34 specs in CI on Linux, but it won't launch on the
  Windows machine this was built on (`spawn UNKNOWN`, although the binary runs from a shell),
  so it stays out of the local `check`.
- **Screen readers beyond NVDA with Chrome.** NVDA covers 15 of the checklist's checks in CI
  (section 8). The rest of the list, VoiceOver, JAWS and Firefox are unchecked, and no
  screen-reader user has tried the kit. The automated pass proves the announcements, not that
  the experience is good.
- **The anchor positioning fallback in a browser.** Its maths is unit-tested; its behavior in a
  browser without anchor positioning isn't.
- **Touch.** Tooltips deliberately don't open on touch, and nothing yet tests the components
  on a touch device.
- **Live mode against the real API.** The route typechecks against the SDK and its client path
  is tested end to end with intercepted, real-format SSE, but no session has run against Claude
  yet: it needs an API key on the server.
