# Mobile

Most web traffic is now on phones. By StatCounter's count, about 62% of web traffic worldwide
came from phones in the second quarter of 2025 ([Statista][share]), and there is no reason to
expect readers of this project to differ much. This
page sets out the standards that Keystone holds itself to on small screens, with the source of
each one and how it is checked. Every rule here has a test that fails when the rule is broken, in
`apps/docs/tests/mobile.spec.ts` and `apps/agent/tests/mobile.spec.ts`.

## The standards

### Nothing scrolls the page sideways

At 320 CSS pixels wide, every page works without scrolling in two directions. This is WCAG 2.2
success criterion 1.4.10, Reflow ([Deque][reflow]). The width of 320px is not arbitrary. It
is what a 1280px window becomes at 400% zoom, so the same rule serves people who zoom in on a
desktop and people with small phones ([NYU][nyu]).

The criterion makes an exception for content that needs two dimensions to make sense, such as a
data table. The exception covers only that part. The table scrolls inside its own container, and
the rest of the page still reflows ([216digital][216], [BOIA][boia]). Keystone's tables, code
blocks and diffs each scroll inside a labelled, focusable region, so keyboard users can scroll
them too.

The tests check every docs page and every state of the agent app at 320px and 375px. The page
cannot be wider than the window, and no element may extend past the right edge unless it is held
by a scroll container of its own.

### Every control is big enough to hit

Two numbers matter here ([AllAccessible][258], [Evinced][evinced]).

| Standard | Minimum | What it's for |
| --- | --- | --- |
| WCAG 2.2, 2.5.8 Target Size (AA) | 24 × 24 CSS px | Every pointer. Smaller targets pass only if they are spaced so that a 24px circle on each does not touch another |
| Apple Human Interface Guidelines | 44 × 44 pt | A fingertip |
| Material Design | 48 × 48 dp | A fingertip, on Android |

Keystone has a token for each of the two numbers, `--ks-target-min` (24px) and
`--ks-target-touch` (44px). Every control is at least as large as the first. On a touch screen
(`pointer: coarse`), every control in the kit grows to the second. This covers buttons, fields,
tabs, segmented and toggle buttons, menu items, disclosures, accordion headings, the slider and
the popover's close button. The appearance on a desktop does not change.

Checkboxes, radios and switches reach 44px in a different way. The whole row is the hit area, as
in a settings row on a phone, so the drawn box stays 16px and a tap anywhere along the row
toggles the control.

Links and buttons inside a sentence are exempt, as 2.5.8 allows, because making them taller
would break the line spacing of the text around them.

The 44px size matters more than the AA minimum because of how people hold their phones. In
Steven Hoober's field study of 1,333 people using phones in public, 49% held the phone in one
hand and tapped with their thumb ([UXmatters][hoober]). A thumb covers more of the screen than a
fingertip held straight on, so a target that is easy to hit with a mouse can be hard to hit
this way.

The tests check every docs page and the agent app at 375px against 2.5.8, including its spacing
exception. They also check every example on every component page, and the agent app, against
44px under touch emulation. A tap at the far end of a checkbox row has to toggle the checkbox.

### Fields don't zoom the page

When a text field whose text is smaller than 16px is focused, iOS zooms the whole page into it
and leaves it zoomed ([CSS-Tricks][zoom], [GitLab][gitlab]). The common fix is to turn off zoom
in the viewport tag. However, that takes pinch-zoom away from everyone who needs it, which fails
WCAG 1.4.4. On touch screens, Keystone's fields therefore use 16px text instead, including the
small size and the command menu's search, and the viewport tag does not restrict zoom.

The tests check the text fields on the Input, Textarea and Select pages, and the agent's
composer, under touch emulation.

### Navigation fits in one hand

On a phone, the docs navigation sits behind a full-width Menu button under the header. The button
also shows which page is open, and it opens the grouped list in place. The navigation used to be
one row of 30 links that scrolled sideways, with most of them off screen and nothing to show that
they were there. The agent app shows its conversation and its workspace one at a time, with a
switch at the top, instead of placing the workspace a long scroll below the composer.

## What isn't covered

No real devices are tested. The tests use the mobile emulation in Chromium and WebKit, which
reproduces layout, touch events and `pointer: coarse` correctly. It does not reproduce a real
keyboard covering half the screen, or how a thumb actually lands, and checking those needs a
phone in hand.

Firefox on Android is not tested either. Playwright cannot emulate a mobile Firefox, so the touch
checks run only in Chromium and WebKit. The 320px reflow checks run in all three.

Landscape phones are not tested. At a height of 256 CSS px, 1.4.10 also covers content that
scrolls sideways by design, such as a carousel. Keystone has no pages built to scroll sideways
(its tables, code blocks and diffs scroll inside their own regions), so this case is not tested.

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
