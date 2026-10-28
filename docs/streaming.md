# Streaming text and screen readers

A model's response arrives a few characters at a time, and a sighted reader watches it grow. A
screen-reader user cannot watch, so the interface has to decide what they hear while it streams.
This page records what I found about that decision, the component I built from it
(`StreamingText`), and what its tests do and do not prove.

## The question

The usual approach is to make the response itself a live region, so that the screen reader reads
whatever changes. A live region was designed for a status that changes now and then, not for a
paragraph that changes forty times a second. My question was whether a different approach is
measurably better, and what "better" would mean to someone listening.

## What the sources say

I looked for primary sources: bug trackers, vendor documentation and practitioners who publish
their test setups. Three findings shaped the design.

**Live regions are inconsistent across screen readers, even in their basic settings.** Adrian
Roselli tested current versions in January 2026. JAWS with Chrome and Narrator with Edge treated
every live region as polite, so `aria-live="assertive"` changed nothing for them. VoiceOver with
Safari on macOS skipped polite regions during read-all, and assertive ones stopped the reading
altogether. No screen reader announced a region hidden with `hidden`, `aria-hidden` or
`display: none`. [1]

**`aria-busy` does not hold announcements back, except in VoiceOver on macOS.** The ARIA spec
says assistive technology may wait while a region is busy, which would suit streaming: mark the
response busy, then clear it at the end. Gerard Cohen tested this in December 2025. VoiceOver on
macOS waited, as the spec describes. JAWS ignored the attribute, and NVDA, VoiceOver on iOS and
TalkBack announced nothing at all, before or after the region stopped being busy. [2] An NVDA
issue filed in 2026 measured the same thing: an update made while busy was announced in 0 of 10
runs in Chrome and 0 of 10 in Firefox, against 10 of 10 without `aria-busy`. The issue was closed
as completed with no comment, so I cannot tell whether that means fixed or intended. [3]

**Shipping products mostly keep the response silent.** VS Code's Copilot Chat plays a sound when
a request is sent, loops a progress sound while the response is pending, and plays another when
it arrives. The response itself is read on demand in an Accessible View. [4] One open-source
chat interface moved to the same pattern after a user reported fragmented speech with NVDA: the
transcript stopped being live, and a separate region announces finished replies. [5] I found no published guidance
from a standards body or a screen-reader vendor on chunking streamed text, and no tested
recommendation for a debounce interval.

The last point matters most for the design. A silent response is safe, but it moves the problem
to the user, who must wait for the end and then go and read it. Nobody had measured whether a
middle path works.

## The design

`StreamingText` keeps the visible text out of any live region, as the products above do, and adds
a second, visually hidden polite region that receives whole sentences.

- **Sentences, not tokens.** Everything up to the last finished sentence is announced at once, so
  a burst of tokens that completes three sentences is one announcement. An unfinished sentence
  waits. The boundary rules ignore full stops inside inline code, in numbers and after common
  abbreviations, and treat a line break or a closing colon as a boundary, because lists and tool
  calls follow them.
- **A pause flushes.** Models often stop mid-sentence before calling a tool ("Checking what else
  calls `firstPage`"). After 1.5 seconds without new text, the unfinished part is said, so the
  listener is not left in silence.
- **History stays quiet.** Text that was already complete when the component mounted is never
  announced, so a long conversation does not replay itself.
- **The announcement is removed afterwards.** Five seconds after the stream ends, the hidden
  region empties, so a reading cursor does not find the last sentence twice.
- **Each announcement is a new node.** Replacing the text node would not announce a sentence that
  repeats the previous one, and the region exists from the first render, because a region added
  together with its text is often ignored.
- **The mode is a choice.** `announce="end"` says the whole response once it is complete, which is
  closer to the product pattern, and `"off"` is for a page that announces in its own way.

The design rests on one interpretation that the sources do not test: that a sentence is the unit
a listener can use. It is the smallest unit that still makes sense on its own, and it is short
enough to keep up with a model that writes a sentence every second or two. Whether listeners
prefer it to silence until the end is a question for the study, not for the tests.

## What the tests show

The behavior tests (`apps/docs/tests/streaming-text.spec.ts`) drive the docs example on a fake
clock in Chromium, WebKit and Firefox, and read what the live region receives. In the example
response, which has six sentences and one pause, the visible text changed between 36 and 56 times
depending on the engine, and the live region received exactly 6 announcements. They were the 6
sentences, in order, with no backticks. The unfinished sentence before the pause was announced
1.5 seconds after the text stalled and not earlier. Stopping mid-sentence announced the part that
had arrived, so that what was said matched what was shown. These tests prove what the screen
reader is given. They do not prove what it says.

The NVDA tests (`apps/docs/tests-sr/nvda.spec.ts`, checks ST1 to ST3) listen to the same example
with a real NVDA and Chrome in CI. With `StreamingText`, NVDA spoke 6 utterances, which were the
6 sentences, each once, starting between 1.1 and 6.6 seconds after the response began. With the
visible text as the live region instead, NVDA began 25 utterances. Each started again from the
first word of the response, and the second sentence was in 15 of them. The same 7 seconds of
text took NVDA about 25 restarts to get through, and a listener would hear the opening words of
the response over and over.

The first run of these tests reported something else, and the cause was the test. Guidepup
records what NVDA says after a key press until NVDA has been quiet for one second. The stream
pauses for two seconds after its second sentence, so the recording stopped there, and the test
reported that NVDA said two sentences out of six. A probe that logged the live region showed the
page had given NVDA all six on time. The tests now open a second connection to NVDA's relay and
listen for the whole stream. Without that probe I would have concluded that NVDA drops
announcements after a pause, and I would have changed a component that was working.

## What is not proven

- **One screen reader.** The automated checks run NVDA with Chrome, which 17.3% of respondents to
  WebAIM's 2026 survey use as their main combination. JAWS with Chrome, the most common at 31.2%,
  is not automated, and neither is VoiceOver. [6] Roselli's results suggest that VoiceOver users on
  macOS would not hear the sentences during read-all, which is probably the better behavior, but I
  have not checked it.
- **One response.** The example is short and written to exercise the rules. A response with code
  blocks, tables or long lists is likely to need more boundary rules than the ones here.
- **No listeners.** The tests measure counts and order. They cannot say whether a sentence at a
  time is easier to follow than silence until the end, and that is the claim that matters.

## Sources

1. Adrian Roselli, [Live Region Support](https://adrianroselli.com/2026/01/live-region-support.html), January 2026.
2. Gerard K. Cohen, [on aria-busy and live regions](https://gerardkcohen.me/writing/2025/aria-busy-not-your-friend.html), December 2025.
3. NV Access, [NVDA issue 20871](https://github.com/nvaccess/nvda/issues/20871): an update made while `aria-busy="true"` is never announced after it is cleared, 2026.
4. Visual Studio Code, [Copilot settings](https://code.visualstudio.com/docs/copilot/copilot-settings), the accessibility signals, and release notes for versions 1.80 and 1.89.
5. openclaw, [issue 65538](https://github.com/openclaw/openclaw/issues/65538): fragmented streaming announcements with NVDA and Firefox.
6. WebAIM, [Screen Reader User Survey #11](https://webaim.org/projects/screenreadersurvey11/), July to August 2026, 1,780 responses.
