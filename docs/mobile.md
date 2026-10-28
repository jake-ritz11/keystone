# Mobile

Most people who see this work will see it on a phone first: about 62% of web traffic worldwide
came from phones in the second quarter of 2025, by StatCounter's count ([Statista][share]). This
page sets the standards Keystone holds itself to on small screens, where each one comes from, and
how it's checked. Every rule here has a test that fails when it's broken, in
`apps/docs/tests/mobile.spec.ts` and `apps/agent/tests/mobile.spec.ts`.

## The standards

### Nothing scrolls the page sideways

At 320 CSS pixels wide, every page works without scrolling in two directions. This is WCAG 2.2
success criterion 1.4.10, Reflow ([Deque][reflow]). 320px isn't arbitrary: it's what a 1280px
window becomes at 400% zoom, so the same rule serves people who zoom on a desktop and people on
small phones ([NYU][nyu]).

The criterion makes an exception for content that needs two dimensions to make sense, such as a
data table. The exception covers that part only: the table scrolls inside its own container, and
the rest of the page still reflows ([216digital][216], [BOIA][boia]). Keystone's tables, code
blocks and diffs each scroll inside a labelled, focusable region, so keyboard users can scroll
them too.

**Checked by:** every docs page and every state of the agent app, at 320px and 375px: the page
can't be wider than the window, and no element sticks out past the right edge unless a scroll
container of its own holds it.

### Every control is big enough to hit

Two numbers matter ([AllAccessible][258], [Evinced][evinced]):

| Standard | Minimum | What it's for |
| --- | --- | --- |
| WCAG 2.2, 2.5.8 Target Size (AA) | 24 × 24 CSS px | Every pointer. Smaller targets pass only if they're spaced so a 24px circle on each doesn't touch another |
| Apple Human Interface Guidelines | 44 × 44 pt | A fingertip |
| Material Design | 48 × 48 dp | A fingertip, on Android |

Keystone makes both numbers tokens: `--ks-target-min` (24px) and `--ks-target-touch` (44px).
Every control is at least the first. On a touch screen (`pointer: coarse`), every control in the
kit grows to the second: buttons, fields, tabs, segmented and toggle buttons, menu items,
disclosures, accordion headings, the slider and the popover's close button. The look on a desktop
doesn't change.

Checkboxes, radios and switches get their 44px a different way: the whole row is the hit area, the
way a settings row works on a phone, so the drawn box stays 16px and a tap anywhere along the row
toggles it.

Links and buttons inside a sentence are exempt, as 2.5.8 allows, since making them taller would
break the line spacing of the text around them.

Why 44 matters more than the AA minimum: in Steven Hoober's field study of 1,333 people using
phones in public, 49% held the phone in one hand and tapped with their thumb ([UXmatters][hoober]).
A thumb is the least precise pointer there is.

**Checked by:** every docs page and the agent app at 375px, against 2.5.8 including its spacing
exception; and every example on every component page, plus the agent app, under touch emulation
against 44px. A tap at the far end of a checkbox row has to toggle it.

### Fields don't zoom the page

iOS zooms the whole page into a text field whose text is smaller than 16px when it's focused,
and leaves it zoomed ([CSS-Tricks][zoom], [GitLab][gitlab]). The common fix, turning off zoom in
the viewport tag, takes pinch-zoom away from everyone who needs it, which fails WCAG 1.4.4. So on
touch screens Keystone's fields, including the small size and the command menu's search, use 16px
text instead, and the viewport tag leaves zoom alone.

**Checked by:** the text fields on the Input, Textarea and Select pages and the agent's composer
under touch emulation.

### Navigation fits in one hand

On a phone the docs' navigation is behind a full-width Menu button under the header that also
says which page you're on, and opens the grouped list in place. It used to be one row of 30 links
scrolling sideways, with most of them offscreen and no sign they were there. The agent app shows
its conversation and its workspace one at a time, switched at the top, rather than stacking the
workspace a long scroll below the composer.

## What isn't covered

- **Real devices.** The tests use Chromium's and WebKit's mobile emulation. Emulation gets layout,
  touch events and `pointer: coarse` right, but not a real keyboard covering half the screen, or
  how a thumb actually lands. Those need a phone in hand.
- **Firefox on Android.** Playwright can't emulate a mobile Firefox, so the touch checks run in
  Chromium and WebKit only. The 320px reflow checks run in all three.
- **Landscape phones.** At 256 CSS px tall, 1.4.10 also covers content that scrolls sideways by
  design. Nothing here does, so it isn't tested.

## Sources

- [WCAG 1.4.10 Reflow, Deque][reflow]; [NYU on where 320px comes from][nyu]; [the table exception, 216digital][216] and [BOIA][boia]
- [WCAG 2.5.8 Target Size, AllAccessible][258]; [Apple and Material minimums, Evinced][evinced]
- [Steven Hoober, How do users really hold mobile devices? (UXmatters, 2013)][hoober]
- [iOS zoom on fields under 16px, CSS-Tricks][zoom] and [GitLab][gitlab]
- [Share of web traffic from mobile devices, Statista / StatCounter][share]

[reflow]: https://dequeuniversity.com/resources/wcag2.1/1.4.10-reflow
[nyu]: https://digitalaccessibility.nyu.edu/testing/sc1410.html
[216]: https://216digital.com/tag/1-4-10-reflow/
[boia]: https://www.boia.org/wcag2/cp/1.4.10
[258]: https://allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide
[evinced]: https://knowledge.evinced.com/mobile-validations/tappable-area
[hoober]: https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php
[zoom]: https://css-tricks.com/?p=339455
[gitlab]: https://gitlab.com/gitlab-org/gitlab/-/merge_requests/220666
[share]: https://www.statista.com/statistics/277125/share-of-mobile-internet-traffic/
