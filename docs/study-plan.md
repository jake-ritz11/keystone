# Study plan

In phase 3, people use the agent app, and the study asks which ways of working with an agent they
actually prefer. I wrote this plan before any sessions ran, so that the case study can be held to
it. The questions and the expectations come from [variants.md](variants.md).

This is an informal usability study for a portfolio rather than formal research. It collects no
sensitive data, offers no compensation and takes only volunteers. It still follows the habits of
a careful study (written consent, minimal data, a plan made in advance), because the results are
only worth publishing if they were gathered honestly.

## Status

The instrumentation is built and tested. It covers consent, event logging, post-task ratings,
suggestions, and download and delete. Two things that the study needs are not done yet. Live
mode has to be configured with an API key, and the app has to be deployed. Replays do not branch
on what the participant does, so they are never used for the study.

## Participants

The study will have 8 to 12 participants who have used an AI coding tool at least a few times.
They are recruited from colleagues and friends of friends, and they do not need to be
developers. That number is too small for statistics, so the study is descriptive, and anything
it finds should be read as a lead rather than as a result.

## Design

There are 18 combinations of the three variants, which is too many for each person to try, so
the variants are divided as follows.

Approval, the dimension with the most at stake, is compared within each participant. Each person
does three tasks, one under each approval mode, in an order that rotates across participants (a
Latin square), so that no mode always comes first. Planning and tool visibility are assigned per
participant, rotating through their six combinations, so that each combination is seen by at
least one person and ideally by two. The tasks rotate as well, so that each approval mode is
paired with different tasks across participants.

## A session (about 30 minutes)

1. Consent. The participant reads the in-app consent screen and chooses to take part.
2. Warm-up (2 min). The participant sees one replay, to learn what the app does. The warm-up is
   not recorded.
3. Three tasks (about 6 min each), live, each under its assigned variants. After each task, the
   app asks three questions, answered from 1 to 5: "I felt in control of what the agent did", "I
   trusted the changes it made", "Working with it took little effort".
4. Wrap-up (5 min). The participant is asked which approval mode they would choose for their own
   work, and why, and anything they would change. These answers are written as suggestions in
   the app.
5. Export. The participant downloads their record and sends it. Nothing is sent automatically.

Participants may think aloud if they choose, and I take notes by hand. There is no screen or
audio recording.

## What's recorded

The data dictionary is the code in [`study.ts`](../packages/agent-core/src/study.ts), where each
event is derived from a session action, and the tests check that what is left out is never
recorded.

| Event | When | Data |
| --- | --- | --- |
| `turn_start` | The agent starts a turn | Turn number |
| `turn_end` | A turn finishes | Turn, stop reason, number of tool calls |
| `approve` / `reject` | An edit is decided | Tool, lines added and removed; for rejections, whether a reason was given and its length |
| `undo` | An applied edit is undone | Tool, lines added and removed |
| `plan_approved` | A plan is approved (plan-first) | Number of steps, whether feedback was given |
| `note` | A note is added mid-run | Its length, and what the agent was doing |
| `stop` | The participant stops the run | What the agent was doing |
| `review_done` | End-of-run review is finished | (none) |
| `expand` | A tool call's details are opened | Which tool |
| `follow_up` | A follow-up message after the task | Its length |

Every event has a time in milliseconds since the session started. Each session also records its
task, mode, variant, start and end time, and how it ended.

The record never contains names, email addresses, IP addresses or anything about the device, and
it never contains anything typed to the agent. A rejection's reason is recorded as a length and
never as words. The only text kept is a suggestion that the participant writes for the study,
and that text is kept deliberately. The participant ID is random and links to nothing.

The record is stored in the participant's browser until they download it. Leaving the study
deletes it from the browser.

## Analysis

The analysis reports five groups of results.

- For each approval mode, the median time on task, the time spent waiting on the participant,
  the edits rejected and undone, and the three ratings.
- For each visibility variant, how often details were opened, and the time from an edit
  appearing to a decision on it.
- For each planning variant, the plans approved as they were or with feedback, and the edits
  rejected after the plan was approved.
- For the task outcome, each final site scored against the task's rubric (in
  [`site.ts`](../packages/agent-core/src/sample/site.ts)), blind to the variant where possible.
- The suggestions and think-aloud notes, grouped into themes by hand.

After that, I will mark each expectation in [variants.md](variants.md) as supported,
contradicted or unclear, including the ones I got wrong.

## Limitations, stated up front

- The sample is small and self-selected, and it is likely to be friendlier and more technical
  than average.
- There is one small sample site and four short tasks, while real work is longer and messier.
- The first variant a person sees may be judged differently because it is new, and the rotation
  only partly offsets this.
- The model's output varies between runs, so two participants do not see identical agents.
- I built the app and I am also running the study, so I will be careful but not neutral.
