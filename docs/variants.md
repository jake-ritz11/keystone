# Interaction variants

The agent app contains three open questions about working with a coding agent. Each question is
a switch in the app, so that testers in phase 3 can do the same task under different answers.
This page gives the reasoning behind each switch. For each one it states the question, what each
answer gives up, what I expect to happen, and what the study will measure to find out.

I wrote the expectations down deliberately, before any testing. Once the study has run, the case
study will compare them with what testers did, including the cases where the expectations were
wrong.

## 1. Planning: act at once, or plan first?

The question is whether the agent should start working right away, or show its plan and wait for
a go-ahead.

| Option | What happens | Trades away |
| --- | --- | --- |
| **Act at once** (default) | The agent writes a short plan as a live checklist and starts immediately. | The chance to redirect before any work happens. A wrong first step costs a rejected edit. |
| **Plan first** | The agent reads what it needs, proposes a plan, and stops. Edits fail until the plan is approved, optionally with feedback. | Speed, and an extra decision on every task, including obvious ones. |

I expect plan-first to help on vague tasks, such as "fix accessibility problems", and to get in
the way on precise ones, such as "fix the broken link". I also expect testers to approve most
plans unchanged, so I expect the main effect of plan-first to be on confidence rather than on
outcomes.

The study measures how many plans are approved as they are and how many with feedback, how many
edits are rejected later in the run, the time to the first applied edit, and the self-reported
sense of control. Each of these is split by how vague the task is.

## 2. Tool visibility: how much of the work to show?

The question is how much of what the agent does besides the edits themselves (reading files,
searching, planning) the user should see.

| Option | What happens | Trades away |
| --- | --- | --- |
| **Timeline** (default) | Every tool call is a row, expandable to its output. | Attention. A long run is a long list, and the edits that need a decision sit among reads that do not. |
| **Narrative** | Consecutive reads and searches fold into one line ("Read 2 files and searched once"); edits stay in full. | Detail that has to be expanded to be seen, and a summary that has to describe the agent's work fairly. |
| **Outcomes only** | Only what the agent says and the edits it makes. | The ability to check how the agent reached a change, or to spot it reading the wrong file. |

I expect Narrative to be the most preferred, because it keeps the edits easy to find and the
agent's process one click away. I expect Outcomes only to feel fastest, but to lower trust when
an edit is surprising, because there is no trail to check.

The study measures how often testers expand a read and the time from an edit appearing to a
decision on it. It also measures the reject rate, to see whether more context leads to more
confident rejections, and it records a preference ranking and whether testers notice when the
agent read something irrelevant.

## 3. Approval: when do edits need a human?

The question is at what point the user decides on an edit.

| Option | What happens | Trades away |
| --- | --- | --- |
| **Approve each edit** (default) | Every edit waits, as a diff, until it is approved or rejected (with an optional reason the agent reads). | Flow. The user has to be present for every step, and the agent stalls while they are not. |
| **Review at the end** | Edits apply as the agent works (it sees its own changes), then all of them are reviewed together, each one undoable. | Early correction. By the time a bad edit is reviewed, later edits may build on it. |
| **Apply automatically** | Edits apply at once; each can be undone at any time, and the agent is told about it. | The moment of decision. Undo is always there, but nothing asks the user to look. |

I expect Approve each edit to feel the safest and the most tiring, and to be by far the slowest
on tasks with more than one edit. I expect Review at the end to be preferred for tasks with
several related edits, because related changes make sense together. I expect Apply
automatically to lead to the fewest reviewed diffs, and that is the risk of this setting.

The study measures total time, the time spent waiting on the user, edits undone after being
applied, diffs expanded or scrolled in review, and the reject reasons given. For each task it
also checks whether the final site meets the task's rubric.

## Steering

Two controls are on in every variant. Stop answers every pending edit and ends the run cleanly,
and notes reach the agent with its next step. I do not compare them, because taking them away is
not a design question worth a tester's time. I would count an agent that cannot be interrupted
as a bug rather than as a variant.

## Fairness across variants

- The agent, model, prompts and tools are identical in every variant. Only plan-first changes
  the system prompt, and only to tell the agent to wait for approval.
- The visibility variants draw the same session state differently, and none of them hides an
  edit.
- Variants change between sessions and never during one, so no run is mixed.
- Replays assume that their edits are approved and do not branch on the tester's choices, so
  they are used for demos and never for the study. The study uses live sessions.
