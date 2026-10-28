# Phase 2: the agent interface

Phase 2 is a web app for working with a coding agent, built on the Keystone kit. The agent edits
a small, sandboxed static site. Each open question in agent UX (how much to show, when to ask,
how to steer) is a **variant** that can be switched, so that the testers in phase 3 can compare
the answers on the same task.

## What a session looks like

1. The tester picks a task, such as "make the pricing table readable on phones", for a bundled
   mini site (`index.html`, `styles.css`, `README.md` and a few more files).
2. The agent plans, reads files and proposes edits. The UI shows its progress, its tool calls
   and each edit as a diff.
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

The server is stateless. The client sends the conversation and gets one streamed model turn
back. There is no session store, so the server should run on serverless hosting without
changes, although that is untested until the app is deployed.

The tools run in the browser against an in-memory map of files. The model never touches a real
file system or the network, and paths are confined to the workspace.

Approval is implemented as the client pausing. When a turn ends with calls to write tools, the
client holds them until the user decides and then sends the results. The UI therefore controls
the loop fully.

In replay mode, recorded turns are served in place of the API, with realistic timing. The
behavior tests, the demo and reviewers without an API key all use it. Live mode needs
`ANTHROPIC_API_KEY`.

### Model call

The model is Claude Opus 5.5 (`claude-opus-5-5`), called with streaming and with adaptive
thinking set to `display: "updates"`, so that the progress notes the model writes between tool
calls can be shown as status. `effort` is set explicitly. The server-side refusal fallback is on
(`fallbacks: "default"`). The edit tools use `eager_input_streaming`, so that a diff can render
while it is being written, and every tool input is validated against its schema before the tool
runs.

### Tools

| Tool | Kind | Does |
| --- | --- | --- |
| `update_plan` | meta | Sets the plan as steps, each with a status. Rendered as a checklist. |
| `list_files` | read | Paths and sizes |
| `read_file` | read | One file's contents |
| `search` | read | Literal or regex search across files, with line numbers |
| `edit_file` | write | Replace an exact snippet in a file (must match once) |
| `create_file` | write | New file |
| `delete_file` | write | Remove a file |

Read tools run immediately. Write tools go through the approval variant.

## Variants

The reasoning for each variant, with expectations written down before any testing, is in
[variants.md](variants.md).

There are three dimensions, and each can be switched at runtime from a panel. A session's
variant is recorded with its events for the study.

| Dimension | A | B | C |
| --- | --- | --- | --- |
| **Planning** | Act at once; the plan is a live checklist | Plan first; nothing runs until the plan is approved or edited | |
| **Tool visibility** | Timeline: every call as a compact row, expandable | Narrative: calls grouped under the step they serve, reads folded into "Read 3 files" | Outcomes only: just edits and the final summary |
| **Approval** | Each edit as it is proposed | One changeset at the end, review all diffs together | Auto-apply, with undo per edit and for the whole run |

Steering is not a variant. Interrupt and "add a note mid-run" are always available, because
taking them away is not a design question worth a tester's time.

## Packages

- `packages/agent-core` holds the workspace model, the tool definitions and executors, diffs,
  the session reducer (events in, UI state out) and the replay fixtures. It is pure TypeScript,
  unit-tested in Node, with no React.
- `apps/agent` is the Next.js app. It contains only UI, built from Keystone components and from
  new components the app needs. Those go into the kit (`packages/ui`) first, with documentation
  and tests.

The new kit components this phase will likely need are Textarea (for the composer), DiffView,
Disclosure, Badge/Status, Progress, Toggle group and Kbd. Each one goes into the kit with its
own page and specs, in the same way as the phase 1 components.

## Milestones

Milestones 1 (core), 2 (replay end to end, with specs for every variant), 3 (live mode) and 4
(variant rationales, in [variants.md](variants.md)) are done. Live mode's client path is tested
against an intercepted route that serves real SSE frames. It has not yet run against the API
itself, because that needs a key. The next milestone is 5, the remaining kit components.

1. Core. `agent-core` with workspace, tools, diffs and the reducer, fully unit-tested, and the
   sample site and three tasks.
2. Replay end to end. The app runs a recorded session through the real UI, with Playwright specs
   on top.
3. Live mode. The `/api/turn` route, streaming, tool-input validation, and budget and rate
   limits.
4. Variants. All three dimensions can be switched, and each has a written rationale.
5. New kit components. Extracted and documented as the app needs them.
6. Study instrumentation (start of phase 3). Consent screen, opt-in event logging and in-app
   suggestions. This is built, and the plan is in [study-plan.md](study-plan.md).

## Cost and safety

The server enforces a budget cap per session (in tokens) and per day (across all sessions).
There is also a rate limit per client. The client holds no secrets, and the API key lives only
in the server environment. The workspace is data in memory, and nothing the model writes is
executed except the preview, which renders in a sandboxed iframe without scripts.
