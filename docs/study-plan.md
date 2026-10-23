# Study plan

Phase 3 puts the agent app in front of people and asks which ways of working with an agent
they actually prefer. This is the plan, written before any sessions run, so the case study
can be held to it. The questions and expectations come from [variants.md](variants.md).

It's an informal usability study for a portfolio, not formal research: no sensitive data, no
compensation, volunteers only. It still follows the habits of a careful study (written
consent, minimal data, a plan made in advance) because the results are only worth publishing
if they were gathered honestly.

## Status

The instrumentation is built and tested: consent, event logging, post-task ratings,
suggestions, and download and delete. Running the study needs two things that aren't done yet:
live mode configured with an API key, and the app deployed. Replays don't branch on what the
participant does, so they're never used for the study.

## Participants

8 to 12 people who have used an AI coding tool at least a few times. Recruited from
colleagues and friends of friends, with no requirement to be a developer. That's too few for
statistics; the study is descriptive, and anything it finds is a lead, not a result.

## Design

There are 18 combinations of the three variants, too many for each person to try. So:

- **Approval** is compared **within** each participant, the dimension with the most at stake.
  Each person does three tasks, one per approval mode, in an order that rotates across people
  (a Latin square), so no mode always comes first.
- **Planning** and **tool visibility** are assigned **per participant**, rotating through the
  six combinations, so each combination is seen by at least one person, and ideally two.
- Tasks rotate too, so each approval mode is paired with different tasks across people.

## A session (about 30 minutes)

1. **Consent.** The participant reads the in-app consent screen and chooses to take part.
2. **Warm-up** (2 min): one replay, to see what the app does, which isn't recorded.
3. **Three tasks** (about 6 min each), live, each under its assigned variants. After each, the
   app asks three questions, 1 to 5: "I felt in control of what the agent did", "I trusted the
   changes it made", "Working with it took little effort".
4. **Wrap-up** (5 min): which approval mode they'd choose for their own work, and why, and
   anything they'd change, written as suggestions in the app.
5. **Export.** The participant downloads their record and sends it. Nothing is sent
   automatically.

Optionally, participants think aloud, and I take notes by hand. No screen or audio recording.

## What's recorded

The data dictionary is the code: [`study.ts`](../packages/agent-core/src/study.ts), where each
event is derived from a session action, and the tests prove what's left out.

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

Every event has a time in milliseconds since the session started. Each session also records
its task, mode, variant, start and end time, and how it ended.

**Never recorded:** names, emails, IP addresses or anything about the device, and anything
typed to the agent. A rejection's reason is recorded as a length, never as words. The only
text kept is a suggestion the participant writes for the study, on purpose. The participant
ID is random and links to nothing.

**Storage:** the record lives in the participant's browser until they download it. Leaving the
study deletes it there.

## Analysis

- **Per approval mode:** median time on task, time waiting on the participant, edits rejected
  and undone, and the three ratings.
- **Per visibility variant:** how often details were opened, and time from an edit appearing to
  a decision on it.
- **Per planning variant:** plans approved as-is or with feedback, and edits rejected after the
  plan was approved.
- **Task outcome:** each final site scored against the task's rubric (in
  [`site.ts`](../packages/agent-core/src/sample/site.ts)), blind to the variant where possible.
- **Suggestions and think-aloud notes:** grouped into themes by hand.

Then each expectation in [variants.md](variants.md) is marked as supported, contradicted or
unclear, including the ones I got wrong.

## Limitations, stated up front

- Small, self-selected sample, likely friendlier and more technical than average.
- One small sample site and four short tasks; real work is longer and messier.
- Novelty: the first variant a person sees may be judged differently, which the rotation only
  partly offsets.
- The model's output varies between runs, so two participants don't see identical agents.
- I built the app and I'm running the study, so I'll be careful, not neutral.
