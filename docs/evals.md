# Does the MCP server help?

Keystone's MCP server exists so that Claude builds with the system rather than around it. Until
this eval, that was an assertion. This page describes how I test it, what each measure can and
cannot show, and the results, once there are any.

## The comparison

Claude is given 8 ordinary UI tasks: a confirmation dialog, a notification settings panel, a
sign-up form, a page with tabs, a list of uploads with progress, a set of questions that expand,
a row with an overflow menu, and a status card with its own styles. Each task is small, and the
kit covers all of it, so the eval asks whether Claude reaches for the kit and follows its rules,
not whether it can do something the kit cannot.

Every task runs in two conditions:

- **Without the MCP tools.** The system prompt says the codebase uses Keystone, that components
  come from `@keystone-ui/ui` and that colors and spacing use `--ks-*` tokens. Claude can write
  files and finish, and nothing else.
- **With them.** The same prompt, plus one sentence naming the tools, and the server's
  `get_tokens`, `get_component` and `audit_component`. They are answered by the functions the
  server itself calls (`packages/mcp/src/tools.ts`), so the eval measures the server that Claude
  Code talks to, not a copy of it.

Everything else is held equal: the model (`claude-opus-5-5` by default), the effort level
(`medium`), the limit of 16 turns, and the tasks. The two conditions alternate within each task
and run, so that a change in the API over the hours a full run takes affects both alike. If the
API declines a request and re-runs it on a fallback model, the run is recorded and left out of
the scores, because it no longer measures the model under test.

## The measures

Every measure is computed from the files Claude wrote, with no model grading another model, so
two people scoring the same files get the same numbers.

| Measure | What it counts | What it misses |
| --- | --- | --- |
| Audit findings | The five rules of `npm run audit:ui`: raw colors, raw spacing, no `:focus-visible`, no reduced-motion fallback, a clickable `div` | Anything the audit's patterns do not match, such as a color set from JavaScript |
| Invented imports | Names imported from `@keystone-ui/ui` that it does not export | Nothing, for this narrow question |
| Invented props | Props on a Keystone component that it does not document and that are not DOM, ARIA or event attributes | Props passed by spreading an object; DOM attributes missing from the allowed list are reported as invented, so each one is checked by hand |
| Rebuilt elements | A native `<button>`, `<dialog>`, `<select>`, checkbox, tab or menu role, and so on, where the kit has a component | Whether the native element was a reasonable choice in context |
| Coverage | The share of the components a good answer uses (for the dialog task, Button and Dialog) | Whether they were used well |

None of these says whether the interface is good. They say whether it follows the system, which
is what the server is for. A run can score perfectly and still be a poor design.

## Running it

```bash
npm run eval -w packages/evals
npm run eval -w packages/evals -- --go --runs 3
npm run report -w packages/evals -- results/<file>.json
```

The first prints the plan and stops. With `--go` it runs 8 tasks, 2 conditions and 3 runs, which
is 48 runs, one at a time, and writes each to `packages/evals/results` as it finishes. The
harness itself is tested against a scripted model (`src/loop.test.ts` and `src/score.test.ts`),
which shows that it answers the tools with the server's text, keeps every file, stops at the
right time and scores what I meant it to score.

## Results

None yet. The harness has not run against the API. When it has, the report goes here with the
number of runs behind each figure, whatever it shows, including a result in which the tools make
no difference.

## Expectations, written before the first run

I expect the largest difference in invented props and coverage, because without the reference
Claude has to guess what Keystone's components are called and what they take. I expect a smaller
difference in audit findings, because the system prompt already says to use tokens, and Claude
follows instructions like that well. I expect the tools to cost more input tokens per run, since
the component reference is long, and I do not know whether the difference in findings will be
worth that cost.
