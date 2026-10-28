# Content guidelines

How Keystone's interfaces talk. These came out of the agent app, where the words carry more
weight than in most products: someone is deciding whether to let software change their files,
and the copy is how they find out what it did, what it wants to do, and what went wrong. Each
rule below is something the app already does, with the example it does it in. The mechanical
ones are checked by a test (see [the end](#what-a-test-checks)).

## Voice

**Plain, specific, calm.** Say what happened in the words the person would use, then stop.
No warmth that costs a reader time, and no alarm that isn't earned.

**The app talks about the agent; the agent talks for itself.** Interface copy says "the agent"
in the third person: "The agent is working. Anything you send now reaches it with its next
step." It never says "I". What the model writes is its own and is shown as its own.

**Honest about state.** A label never claims more than is true. A replayed session says it
assumes its edits get approved. A tool that hasn't run yet doesn't read as if it has.

## Actions

- **Buttons say what they do, verb first.** "Approve plan", "Restart this task", "Download my
  data". Not "OK", "Submit" or "Continue" when something more specific is true.
- **Settings are named, not commanded.** A switch is "Email alerts", not "Turn on email
  alerts": a screen reader reads "Email alerts, switch, on", which a command makes awkward.
- **Destructive actions name what's lost.** "Delete styles.css", not "Delete". The person
  shouldn't need the surrounding context to know what the button does.

## Tool calls and status

The timeline's rows follow the state of the call, so the tense carries information:

| State | Form | Example |
| --- | --- | --- |
| Running | Present participle | "Writing an edit to index.html" |
| Done | Past tense | "Read styles.css", "Searched for “pricing” in index.html" |
| Waiting for approval | Imperative, what will happen if approved | "Edit styles.css" |

Status labels are one or two words, and each says a different thing: Writing, Needs review,
Applied, Rejected, Undone, Failed. "Undone", not "Reverted": the person did it, with the Undo
button, so it's named after the button.

Summaries count in words people say: "Read 3 files and searched once", not "read_file ×3,
search ×1". One is "1 file", never "1 files".

## Errors

**Every error says what happened and what to do next.** "Couldn't reach the model. Check the
connection and try again." If the next step is a control, it's on screen next to the error,
not only in a menu: a stopped session shows a "Restart this task" button beside its status.

- Never "Something went wrong" on its own. If the cause really is unknown, say where it
  happened and what to try: "The server hit an unexpected error. Try again, and if it keeps
  happening, restart the task."
- No blame. "The response was cut off", not "You sent too much". "Paths can't go above the
  workspace root", not "Invalid path".
- No apology theatre: no "Oops", no "Uh-oh". A plain statement is more reassuring than a joke
  at the moment something failed.
- An error is announced once. When the timeline already shows the reason, the status line says
  only "Stopped by an error", so a screen reader doesn't hear it twice.

## Forms

- **A label names the thing; a placeholder shows an example or the next move.** "Message the
  agent" is the label; "Ask for a change…" is the placeholder. A placeholder is never the only
  label.
- **Hints say why or what for,** not what's already obvious: "Usually under ten seconds",
  "Your workspace admin turned this off". A disabled control's hint says why it's disabled, and
  stays readable while the control dims.
- **Optional is marked, in words.** "Why? (optional)". Required fields carry the browser's
  required state; the asterisk is visual only.

## Mechanics

- Sentence case for everything: buttons, headings, labels, menu items.
- "…" (one character) for work in progress and for placeholders that continue. Never three dots.
- Curly quotes around quoted text: Searched for “pricing”.
- Numerals for counts and measures: "3 files", "375 pixels wide", "1 of 3".
- No exclamation marks. Nothing in an interface about someone's code is that exciting.
- No "please", "simply", "just" or "easy". They add length, and "simply" tells someone who's
  stuck that it shouldn't be hard.
- Keys in a shortcut hint as they're printed on the keycap (Esc, Ctrl+K); in a sentence, by
  their full name: "Press Escape to close it."

## Accessible names

- An accessible name says what the thing is, not what kind of thing it is: "Close", not "Close
  button". The role is announced anyway.
- Icon-only controls always have a name, and their tooltip shows the same words.
- A link that opens a new tab says so: "(opens in a new tab)".
- A visible value next to a control (a slider's "8 steps") is hidden from screen readers when
  the control announces the same thing, so it's read once.

## What a test checks

`scripts/copy.test.ts` reads the user-facing strings in the agent app, the agent core, the
component library and the docs examples, and fails on the rules a machine can check without
judgment:

- an exclamation mark ending a sentence,
- three dots instead of "…",
- "Oops", "please", "simply", "Something went wrong" or "click here".

Everything else on this page is a judgment call, and belongs in review.
