# Content guidelines

This page describes how Keystone's interfaces talk. The rules came out of the agent app, where
the words carry more weight than in most products, because the person is deciding whether to let
software change their files. The copy is how they find out what the software did, what it wants
to do and what went wrong. Each rule below is something the app already does, shown with the
example it does it in. A test checks the mechanical rules (see [the end](#what-a-test-checks)).

## Voice

**Plain, specific, calm.** Copy says what happened in the words the person would use, and then
stops. It adds no warmth that costs the reader time and no alarm that the situation has not
earned.

**The app talks about the agent; the agent talks for itself.** Interface copy refers to "the
agent" in the third person, as in "The agent is working. Anything you send now reaches it with
its next step." It never says "I". Text the model writes is shown as the model's own.

**Honest about state.** A label never claims more than is true. A replayed session says it
assumes its edits get approved. A tool that has not run yet does not read as if it has.

## Actions

- **Buttons say what they do, verb first.** "Approve plan", "Restart this task", "Download my
  data". They are not "OK", "Submit" or "Continue" when something more specific is true.
- **Settings are named, not commanded.** A switch is called "Email alerts" instead of "Turn on
  email alerts", because a screen reader reads "Email alerts, switch, on", and a command in that
  position reads awkwardly.
- **Destructive actions name what is lost.** The button says "Delete styles.css" instead of
  "Delete". The person should not need the surrounding context to know what the button does.

## Tool calls and status

The wording of each row in the timeline follows the state of its tool call, so the tense tells
the person which state the call is in.

| State | Form | Example |
| --- | --- | --- |
| Running | Present participle | "Writing an edit to index.html" |
| Done | Past tense | "Read styles.css", "Searched for “pricing” in index.html" |
| Waiting for approval | Imperative, what will happen if approved | "Edit styles.css" |

Status labels are one or two words long, and each one means something different. They are
Writing, Needs review, Applied, Rejected, Undone and Failed. The label is "Undone" instead of
"Reverted" because the person undid the edit with the Undo button, so the label is named after
the button.

Summaries count in the words people say, so a summary reads "Read 3 files and searched once"
instead of "read_file ×3, search ×1". A count of one is "1 file", never "1 files".

## Errors

**Every error says what happened and what to do next.** An example is "Couldn't reach the
model. Check the connection and try again." If the next step is a control, the control is on
screen next to the error and not only in a menu. For example, a stopped session shows a
"Restart this task" button beside its status.

- Never "Something went wrong" on its own. If the cause really is unknown, say where it
  happened and what to try, as in "The server hit an unexpected error. Try again, and if it
  keeps happening, restart the task."
- No blame. "The response was cut off", not "You sent too much". "Paths can't go above the
  workspace root", not "Invalid path".
- No apology theatre, such as "Oops" or "Uh-oh". At the moment something has failed, a plain
  statement is more reassuring than a joke.
- An error is announced once. When the timeline already shows the reason, the status line says
  only "Stopped by an error", so that a screen reader does not read the reason twice.

## Forms

- **A label names the thing; a placeholder shows an example or the next move.** "Message the
  agent" is the label; "Ask for a change…" is the placeholder. A placeholder is never the only
  label.
- **Hints say why or what for,** not what is already obvious. Examples are "Usually under ten
  seconds" and "Your workspace admin turned this off". A disabled control's hint says why it is
  disabled, and it stays readable while the control dims.
- **Optional is marked, in words.** An example is "Why? (optional)". Required fields carry the
  browser's required state, and the asterisk is visual only.

## Mechanics

- Sentence case for everything: buttons, headings, labels, menu items.
- "…" (one character) for work in progress and for placeholders that continue. Never three dots.
- Curly quotes around quoted text: Searched for “pricing”.
- Numerals for counts and measures: "3 files", "375 pixels wide", "1 of 3".
- No exclamation marks. Nothing in an interface about someone's code is that exciting.
- No "please", "simply", "just" or "easy". They add length, and "simply" tells someone who is
  stuck that it should not be hard.
- Keys are written as they are printed on the keycap in a shortcut hint (Esc, Ctrl+K), and by
  their full name in a sentence, as in "Press Escape to close it."

## Accessible names

- An accessible name says what the thing is, not what kind of thing it is: "Close", not "Close
  button". The role is announced anyway.
- Icon-only controls always have a name, and their tooltip shows the same words.
- A link that opens a new tab says so: "(opens in a new tab)".
- A visible value next to a control (a slider's "8 steps") is hidden from screen readers when
  the control announces the same thing, so that it is read once.

## What a test checks

`scripts/copy.test.ts` reads the user-facing strings in the agent app, the agent core, the
component library and the docs examples. It fails on any of the following, which are the rules
a machine can check without judgment.

- an exclamation mark ending a sentence,
- three dots instead of "…",
- "Oops", "please", "simply", "Something went wrong" or "click here".

Everything else on this page needs judgment, so it is checked in review.
