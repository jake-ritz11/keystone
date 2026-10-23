# Interaction variants

The agent app holds three open questions about working with a coding agent. Each one is a
switch, so testers in phase 3 can try the same task under different answers. This page is the
reasoning behind each switch: the question, what each answer trades away, what I expect to
happen, and what the study will measure to find out.

The expectations are written down before any testing, on purpose. The case study compares
them against what testers actually did, including where they were wrong.

## 1. Planning: act at once, or plan first?

**The question.** Should the agent start working right away, or show its plan and wait for a
go-ahead?

| Option | What happens | Trades away |
| --- | --- | --- |
| **Act at once** (default) | The agent writes a short plan as a live checklist and starts immediately. | The chance to redirect before any work happens. A wrong first step costs a rejected edit. |
| **Plan first** | The agent reads what it needs, proposes a plan, and stops. Edits fail until the plan is approved, optionally with feedback. | Speed, and an extra decision on every task, including obvious ones. |

**Expectation.** Plan-first helps on vague tasks ("fix accessibility problems") and gets in
the way on precise ones ("fix the broken link"). Testers will approve most plans unchanged, so
its main effect will be on confidence rather than on outcomes.

**What the study measures.** Plans approved as-is vs. with feedback; edits rejected later in the
run; time to the first applied edit; self-reported sense of control. All split by task
vagueness.

## 2. Tool visibility: how much of the work to show?

**The question.** How much of what the agent does (reading files, searching, planning) should
the user see, beside the edits themselves?

| Option | What happens | Trades away |
| --- | --- | --- |
| **Timeline** (default) | Every tool call is a row, expandable to its output. | Attention: a long run is a long list, and the edits that need a decision sit among reads that don't. |
| **Narrative** | Consecutive reads and searches fold into one line ("Read 2 files and searched once"); edits stay in full. | Detail you have to expand to see, and a summary that has to describe the agent's work fairly. |
| **Outcomes only** | Only what the agent says and the edits it makes. | The ability to check how the agent reached a change, or to spot it reading the wrong file. |

**Expectation.** Narrative will be the most preferred: it keeps the edits easy to find and the
agent's process one click away. Outcomes-only will feel fastest, but it will lower trust when
an edit is surprising, because there's no trail to check.

**What the study measures.** How often testers expand a read; time from an edit appearing to a
decision on it; reject rate (whether more context leads to more confident rejections);
preference ranking; and whether testers notice when the agent read something irrelevant.

## 3. Approval: when do edits need a human?

**The question.** At what point does the user decide on an edit?

| Option | What happens | Trades away |
| --- | --- | --- |
| **Approve each edit** (default) | Every edit waits, as a diff, until it's approved or rejected (with an optional reason the agent reads). | Flow: the user has to be there for every step, and the agent stalls while they aren't. |
| **Review at the end** | Edits apply as the agent works (it sees its own changes), then all of them are reviewed together, each one undoable. | Early correction: by the time a bad edit is reviewed, later edits may build on it. |
| **Apply automatically** | Edits apply at once; each can be undone at any time, and the agent is told about it. | The moment of decision. Undo is always there, but nothing asks the user to look. |

**Expectation.** Approve-each will feel safest and most tiring; on multi-edit tasks it will be
the slowest by far. Review-at-the-end will be preferred for tasks with several related edits,
because related changes make sense together. Apply-automatically will lead to the fewest
reviewed diffs, which is its risk.

**What the study measures.** Total time; time spent waiting on the user; edits undone after
being applied; diffs expanded or scrolled in review; reject reasons given; and, per task,
whether the final site meets the task's rubric.

## Steering

Two controls are always on, in every variant: **Stop**, which answers every pending edit and
ends the run cleanly, and **notes**, which reach the agent with its next step. These aren't
compared because taking them away isn't a design question worth a tester's time. An agent you
can't interrupt isn't a variant, it's a bug.

## Fairness across variants

- The agent, model, prompts and tools are identical in every variant. Only plan-first changes
  the system prompt, and only to tell the agent to wait for approval.
- The visibility variants draw the same session state differently; none hides an edit.
- Variants change between sessions, never during one, so no run is mixed.
- Replays assume their edits are approved and don't branch on the tester's choices, so they're
  for demos, never for the study. The study uses live sessions.
