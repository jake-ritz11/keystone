# Phase 2: the agent interface

A web app for working with a coding agent, built on the Keystone kit. The agent edits a small,
sandboxed static site. Each open question in agent UX (how much to show, when to ask, how to
steer) is a switchable **variant**, so phase 3's testers can compare them on the same task.

## What a session looks like

1. The tester picks a task, such as "make the pricing table readable on phones", for a
   bundled mini site (`index.html`, `styles.css`, `README.md`, a few more).
2. The agent plans, reads files, and proposes edits. The UI shows its progress, its tool
   calls, and each edit as a diff.
3. Edits need approval according to the active variant. A live preview pane renders the site
   before and after.
4. The tester can interrupt, redirect, approve or reject at any point.

## Architecture

```
browser                                          server (one route)
-------                                          ------------------
conversation + workspace (files)   -- turn -->   POST /api/turn
tool execution (pure functions)                   - holds the API key
approval gates between turns       <-- SSE ---    - streams one model turn
preview iframe (srcdoc, sandboxed)                - rate limit + budget cap
                                                  - replay mode: recorded turns, no key
```

- **Stateless server.** The client sends the conversation and gets one streamed model turn
  back. No session store, so it runs on serverless hosting as-is.
- **Tools run in the browser,** against an in-memory file map. The model never touches a real
  filesystem or network. Paths are confined to the workspace.
- **Approval is the client pausing.** When a turn ends with write tool calls, the client holds
  them until the user decides, then sends the results. The UI fully controls the loop.
- **Replay mode.** Recorded turns are served in place of the API, with realistic timing.
  Behavior tests, the demo, and reviewers without an API key all use it. Live mode needs
  `ANTHROPIC_API_KEY`.

### Model call

Claude Opus 5.5 (`claude-opus-5-5`), streaming, adaptive thinking with `display: "updates"`,
so the progress notes the model writes between tool calls can be shown as status, and
`effort` set explicitly. Server-side refusal fallback is on (`fallbacks: "default"`). Edit
tools use `eager_input_streaming` so a diff can render while it's being written; every tool
input is validated against its schema before it runs.

### Tools

| Tool | Kind | Does |
| --- | --- | --- |
| `update_plan` | meta | Sets the plan: steps with a status. Rendered as a checklist. |
| `list_files` | read | Paths and sizes |
| `read_file` | read | One file's contents |
| `search` | read | Literal or regex search across files, with line numbers |
| `edit_file` | write | Replace an exact snippet in a file (must match once) |
| `create_file` | write | New file |
| `delete_file` | write | Remove a file |

Read tools run immediately. Write tools go through the approval variant.

## Variants

Three dimensions, each switchable at runtime from a panel. A session's variant is recorded
with its events for the study.

| Dimension | A | B | C |
| --- | --- | --- | --- |
| **Planning** | Act at once; the plan is a live checklist | Plan first; nothing runs until the plan is approved or edited | |
| **Tool visibility** | Timeline: every call as a compact row, expandable | Narrative: calls grouped under the step they serve, reads folded into "Read 3 files" | Outcomes only: just edits and the final summary |
| **Approval** | Each edit as it's proposed | One changeset at the end, review all diffs together | Auto-apply, with undo per edit and for the whole run |

Steering is not a variant: interrupt and "add a note mid-run" are always available, because
taking them away isn't a design question worth a tester's time.

## Packages

- `packages/agent-core`: workspace model, tool definitions and executors, diffs, the
  session reducer (events in, UI state out), replay fixtures. Pure TypeScript, unit-tested in
  Node, no React.
- `apps/agent`: the Next.js app. UI only, from Keystone components plus new ones the app
  needs, which go into the kit first (`packages/ui`) with docs and tests.

New kit components this will likely need: Textarea (composer), DiffView, Disclosure,
Badge/Status, Progress, Toggle group, Kbd. Each lands in the kit with its own page and
specs, the same way the phase 1 components did.

## Milestones

Done: 1 (core), 2 (replay end to end, with specs for every variant) and 3 (live mode). Live
mode's client path is tested against an intercepted route that serves real SSE frames; it hasn't
yet run against the API itself, which needs a key. Next: 4, variant rationales, then 5.


1. **Core:** `agent-core` with workspace, tools, diffs and the reducer, fully unit-tested;
   the sample site and three tasks.
2. **Replay end to end:** the app runs a recorded session through the real UI. Playwright
   specs on top.
3. **Live mode:** the `/api/turn` route, streaming, tool-input validation, budget and rate
   limits.
4. **Variants:** all three dimensions switchable, each with a written rationale.
5. **New kit components:** extracted and documented as the app needs them.
6. **Study instrumentation** (start of phase 3): consent screen, opt-in event logging,
   in-app suggestions.

## Cost and safety

- Budget cap per session (tokens) and per day (all sessions), enforced on the server.
- Rate limit per client.
- No secrets in the client; the API key lives only in the server environment.
- The workspace is data in memory. Nothing the model writes is executed, except the preview,
  which renders in a sandboxed iframe without scripts.
