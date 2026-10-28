# Decisions

This is a record of the decisions behind Keystone's components and how they held up. It gives
what I decided, what broke, and what the tests proved and did not prove. It covers the phase 1
components (Input, Select, Dialog, Menu, Tabs, Tooltip, Toast) and the test setup around them.

## 1. Built on the platform, not on Radix

The overlays use features that browsers now ship. [Dialog](../packages/ui/src/dialog/Dialog.tsx)
uses `<dialog>` with `showModal()`. [Menu](../packages/ui/src/menu/Menu.tsx),
[Tooltip](../packages/ui/src/tooltip/Tooltip.tsx) and [Toast](../packages/ui/src/toast/Toast.tsx)
use the `popover` attribute, and CSS anchor positioning ties each popover to its trigger.
[Select](../packages/ui/src/select/Select.tsx)'s popup uses `appearance: base-select`, and entry
transitions use `@starting-style`. React is the only runtime dependency.

A headless library like Radix would have been faster to wire up, and it is battle-tested.
However, the browser itself now provides the top layer, an inert background, a focus trap,
Escape handling and light dismiss, which are the hard parts of an overlay. Rebuilding those in
JavaScript means more code to ship and more ways to drift from what the platform does. Building
on the platform also means that less of the behavior is hidden, because everything Keystone adds
is code that can be read in this repository. Keystone adds the following:

- the menu keyboard model, with arrows, Home/End, typeahead and skipping disabled items;
- the tabs keyboard model, with automatic and manual activation;
- controlled state, so React stays the source of truth (`open` drives `showModal()`, and Escape
  calls `onOpenChange(false)` instead of closing the element behind React's back);
- focus return;
- live-region announcements for toasts, and the timing rules for tooltips and toasts.

The approach had three costs. The first is that some of the features are new. Anchor
positioning and `base-select` are not yet supported in every browser. Popovers fall back to a
one-shot JavaScript placement ([`placeFallback`](../packages/ui/src/popover/anchor.ts)), and
Select falls back to the operating system's picker, which is still a fully working select.
Chromium and WebKit need neither fallback. Firefox, which CI added later, has no
`base-select`, so there Select uses the operating system's picker. The placement maths is
covered by [unit tests](../packages/ui/src/popover/anchor.test.ts) and not in a browser.

The second cost is that behavior differs between browsers in small ways. Section 3 is an
example.

The third cost appeared under server components, where cloning triggers broke. The first
Tooltip used `cloneElement` to add ARIA attributes to its trigger. A trigger passed in from a
React Server Component arrived as a lazy reference whose props could not be read, and the page
crashed. Menu and Tooltip now wrap the trigger in a `display: contents` span and set the
attributes on the real element ([`wireTrigger`](../packages/ui/src/popover/anchor.ts)). This is
less elegant than cloning, but it works whatever the caller passes in.

## 2. The toast you could see but not use

Toasts render in a manual popover. Showing that popover again after a modal opens moves it to
the top of the top layer, so a toast appears above an open dialog's backdrop. In the browser it
looked right. However, clicking the toast's dismiss button closed the dialog behind it.

A modal dialog makes everything outside it inert, and being on top visually does not change
that. `document.elementFromPoint` at the dismiss button returned the `<dialog>` instead of the
button. The click went to the dialog element, and Dialog read a click on its own element as a
backdrop click, so it closed. The same inertness means that screen readers may not announce a
live region outside the modal.

While a modal is open, the whole toast layer, including its live regions, is now portalled into
the topmost `dialog:modal`, and it moves back out when that dialog fires `close`. Moving the
layer remounts the live regions, so an announcement waits 100 ms for the new region to be in
the accessibility tree. A toast that can be seen but not clicked or heard is worse than no
toast. The behavior test "over a modal dialog it can be used without closing the dialog" checks
this case.

The screenshot of this state passed while the click failed, so a check that something is
visible is a different check from one that it is usable.

## 3. Safari doesn't focus what you click

The first WebKit run failed two Dialog tests. After the dialog closed, focus did not return to
the button that had opened it. Chromium passed both tests.

In Safari, clicking a button does not focus it. When the dialog opened, `document.activeElement`
was therefore `<body>`, and Dialog saved `<body>` as the element to return focus to. A probe run
in both engines confirmed this. After the dialog was opened with the mouse and closed with
Escape, focus landed on `BUTTON` in Chromium and on `BODY` in WebKit. Opening with the keyboard
worked in both engines, because a keyboard user's trigger already has focus.

In the fix ([`05cd30e`](https://github.com/jake-ritz11/keystone/commit/05cd30e)), Dialog keeps a
capture-phase `pointerdown` listener on the document that remembers the last control pressed.
When the dialog opens, it uses the focused element if there is one, and the last pressed
control otherwise. The cost is a document-level listener installed when the module loads, which
is a global side effect. The listener is small and passive, and it is the price of getting focus
return right in Safari for mouse users.

## 4. Tests run in real browsers

Behavior tests are Playwright specs in [`apps/docs/tests`](../apps/docs/tests). They run
against the production build of the docs site in Chromium and WebKit as the last step of
`npm run check`, and CI also runs them in Firefox. The current counts are in the
[case study](case-study.md#what-the-tests-cover).

I did not use jsdom because it implements neither `showModal()`, nor `popover`, nor anchor
positioning. Tests in jsdom would exercise polyfills and mocks, so they would only prove that
the mocks work. The point of building on the platform is that the platform does the work, so
the platform has to be in the test.

The demos on each docs page are the test fixtures, so every state shown on a docs page is also a
state under test. Assertions find elements by role and accessible name
(`getByRole("menu", { name: "Actions" })`), so every test checks the ARIA wiring, and not only
the tests written about it. The tests run with reduced motion turned on, and the toast timers
run on Playwright's fake clock. That makes tests such as "dismisses after 5 s" and "hovering
pauses the timer" exact instead of flaky.

The setup cost the browser downloads and about 20 seconds per run. There were also two
surprises on the test side. Next.js ships its own `role="alert"` route announcer, so the toast
assertions filter by text. Playwright also refuses to click an `aria-disabled` item without
`force`, and clicking such an item is exactly the case under test.

## 5. What the mutation checks showed

A passing test proves little until it has been seen to fail. I broke the code deliberately in
two places and recorded what the tests did.

| Mutation | Expected | Result |
| --- | --- | --- |
| Remove Menu's own focus-return line | Focus-return tests fail | **All 9 Menu tests still passed** |
| Stop Menu skipping disabled items | Arrow-key test fails | Failed, as it should |

The first result is the interesting one. Chromium already returns focus to the previously
focused element when a popover that contains focus closes, so Keystone's own `trigger.focus()`
in [Menu](../packages/ui/src/menu/Menu.tsx) is redundant there. The test checks the behavior,
which holds either way, so it cannot tell whether the line does anything. The line stays as a
backstop for browsers that do not return focus themselves. However, it is effectively untested
code, and I record it here so that it does not look covered.

The Safari bug in section 3 acted as an unplanned mutation. It was one real platform
difference, and two tests caught it at once.

Building on the platform therefore means that the platform does more than expected, so some of
the code turns out to be insurance. The first result also supports the point this section
opened with, that a passing test says something only once it has been seen to fail.

## 6. Nothing moves under the pointer

Content that moves while someone is aiming at it causes misclicks. A review found three places
in the kit where this happened.

| Where | What moved | Fix |
| --- | --- | --- |
| Dialog | Locking scroll hid the scrollbar, so the page widened and centered content slid sideways (7px in the test). | While locked, the scrollbar's gutter stays reserved (`scrollbar-gutter: stable`), but only if the page had a scrollbar, so short pages don't gain an empty gutter instead. No JavaScript measuring. |
| Input and Select | A validation error appeared under a field on blur, pushing down the field you were clicking. | One message line per field, reserved by default. An error takes the hint's place instead of adding a line; the hint stays in the field's description, visually hidden. Errors no longer disappear when the field is focused. |
| Button | The loading spinner was added before the label, widening the button. | The spinner overlays the content, which stays laid out at zero opacity, so the width can't change and the accessible name stays. |

[`layout.spec.ts`](../apps/docs/tests/layout.spec.ts) measures each one before and after. The
dialog test needed real scrollbars. Headless Chromium hides scrollbars by default, which made
the first version of the test pass even with the fix removed. Playwright's `--hide-scrollbars`
flag is now dropped for Chromium. In WebKit, which draws overlay scrollbars that take no space,
the test skips and says why. With the fix removed, the test fails.

## 7. A second pair of eyes

After the layout fixes, an independent review of the kit, done without seeing my reasoning,
found 13 more defects, and all of them were real. The ones worth remembering are below.

Dialog and Menu scoped their layout to `[open]` and `:popover-open`. During the exit fade the
element is no longer open but is still displayed, so its contents re-laid out side by side for
200ms. The layout now lives on the base rule, and only `display` toggles. Exits are plain fades,
and entrances rise without scaling, because scaled text blurs.

Hovering an invalid field turned its red border grey, because the hover rule out-ranked the
invalid one. Pressing Escape on a tooltip inside a dialog also closed the dialog. The tooltip
now handles the key in the capture phase and stops it.

In a menu, hover and keyboard focus were painted separately, so two rows could look selected.
The pointer now moves focus, so a menu has one highlight.

The review also found problems with touch, right-to-left layouts and overflow. On phones, hover
styles stuck after a tap, and they are now behind `@media (hover: hover)`. Physical left and
right properties broke right-to-left layouts, and the tab arrow keys did not mirror. Long tab
lists, menus, titles and labels could extend past the edge of the screen. Toasts jumped when one
arrived or left, and they now glide into place.

Finally, page CSS leaked into the kit. The docs site's global `th`/`td` rules restyled
DiffView's table. Kit components now set their own table boxes explicitly, and the docs scope
their table styles.

Each behavioral fix has a spec in [`polish.spec.ts`](../apps/docs/tests/polish.spec.ts) or
[`layout.spec.ts`](../apps/docs/tests/layout.spec.ts).

## 8. A screen reader in CI

The scripted NVDA pass was meant to be done by hand. Most of it now runs on every push instead.
[Guidepup](https://www.guidepup.dev) starts a real NVDA on a Windows runner, Playwright drives
Chrome, and [`tests-sr/nvda.spec.ts`](../apps/docs/tests-sr/nvda.spec.ts) asserts on what NVDA
said. It is a separate workflow from `check`, because it is slower (about five minutes) and
depends on speech timing.

It took four rounds of changes before the results could be trusted. First, focus that
Playwright sets from outside is not announced, so a test that calls `focus()` hears silence and
proves nothing. Every move now goes through NVDA as a key press. To reach an element, the test
focuses the element before it and presses Tab.

Second, Guidepup by default keeps only the first phrase after a key press. This dropped the
newly focused element whenever a key both changed state and moved focus, so opening a menu was
read as only "expanded". The tests now capture everything.

Third, NVDA keeps the first Escape pressed in a text field for itself, to leave focus mode, so
the dialog never received it. Someone using NVDA has to press Escape twice for the same reason,
so the test does the same.

Fourth, some of the expectations were mine and did not match what NVDA does. NVDA leaves out
"menu item" inside a menu, and in Chrome it reads `role="alertdialog"` as "dialog". The specs
now expect this instead of failing on it.

One of my explanations did not hold. After a dialog closes, NVDA reads "Skip to content" before
it reaches the opener. I assumed that focus came back a task too late, and I moved the `focus()`
call next to `close()`. NVDA still read it. The cause is NVDA's browse-mode cursor. The cursor
was inside the dialog, the dialog was removed, and the cursor reset to the top of the page
before following focus. I reverted the change, and the spec records why.

NVDA also read the newly selected tab twice, and read every dialog's name and description twice
when the dialog opened. I fixed the first of these and not the second. Instead of guessing, I
built a throwaway page that put the candidate fixes side by side, and CI recorded what NVDA said
for each.

For Tabs, my first theory was that focus moved before the tab became selected, and that NVDA
announced both. Selecting the tab first did not change anything. A second run took the tab
pattern apart one attribute at a time. Swapping panels, naming them and making them focusable
were all read once, and every variant with `aria-controls` was read twice. NVDA does not use
`aria-controls` otherwise, so Tabs leaves it out. The panel is still named by its tab, and the
spec counts the announcement. The cost is that JAWS users lose the shortcut to a controlled
panel.

For Dialog, five native dialog variants were all read twice. They covered a dialog with and
without a description, and focus placed by the `autofocus` attribute, by script in the same
task, by script a frame later, and by the browser's own default. Nothing in the markup changes
the repeat, so I concluded that it comes from NVDA with Chrome and not from the markup.
Dialog stays as it is. Swapping the native element for a `div` would give up the top layer and
the inert background to work around a screen reader quirk. The results are in the
[checklist](screen-reader-checklist.md#results).

## 9. Centering text by measurement

Badge and button labels looked slightly low on my Windows machine, so I measured them instead
of adjusting them by eye. A test inserts a zero-size marker at the start of each label to find its
baseline, reads the font's cap height from a canvas, and compares the space above the capitals
with the space below the baseline. Button labels were 0.9px low.

There were two causes. First, the tokens named Inter as the typeface, but no app loaded it, so
every operating system drew the text in its own fallback font, each with different vertical
metrics. Both apps now self-host Inter and JetBrains Mono, which also means the screenshots in CI
use the same font as a reviewer's browser. Second, with Inter loaded, tabs, segmented options and
small buttons were still 0.9px high. Their line height of 1.2 at 14px makes a 16.8px line box,
and the browser snaps the text to a whole pixel. The tokens now write that line height as
`round(up, 1.2em, 2px)`, an even number of pixels, and on Windows every measured label is
centered to within 0.1px. `alignment.spec.ts` checks every component page, but with a tolerance
of 1.2 pixels, because Linux snaps baselines differently: in CI the Large button's label measures
1.0px high where Windows measures it centered. At that tolerance the test catches a label that is
clearly off, but it would not catch the 0.6 to 0.9px offsets this pass fixed, which I checked by
removing the rounding.

The same review found spacing problems that the measurement could not:

- closed Accordion sections kept 12px of padding, because `hidden="until-found"` hides content
  with `content-visibility` and not `display: none`;
- the RadioGroup legend sat 6px above its first option while the options were 14px apart, because
  a fieldset's legend is outside the flex layout and the gap does not reach it;
- SegmentedControl stretched to the full width of a flex column;
- an icon-only button was 50 by 34 pixels instead of square;
- the toast's icon and close button were aligned to the top of the toast, not to its title;
- a props table broke `"neutral"` in the middle of the word.

## What isn't proven yet

Firefox has not been run locally. It passes in CI on Linux, but it does not launch
on the Windows machine Keystone was built on (`spawn UNKNOWN`, although the binary runs from a
shell), so it is left out of the local `check`.

Screen readers other than NVDA with Chrome are untested. NVDA covers 15 of the checklist's
checks in CI (section 8). The rest of the list, which covers VoiceOver, JAWS and Firefox, is
unchecked, and no screen-reader user has tried the kit. The automated pass proves the
announcements, but it does not show that the experience is good.

The anchor positioning fallback has not been tested in a browser. Its maths is unit-tested, but
its behavior in a browser without anchor positioning is not.

Touch is untested. Tooltips deliberately do not open on touch, and nothing yet tests the
components on a touch device.

Live mode has not run against the real API. The route typechecks against the SDK, and its
client path is tested end to end with intercepted SSE in the real format. However, no session
has run against Claude yet, because that needs an API key on the server.
