/**
 * Runs every task in both conditions and writes the raw results, which report.ts scores.
 *
 *   node src/run.ts                  prints the plan and the number of runs, and stops
 *   node src/run.ts --go             runs it (needs ANTHROPIC_API_KEY or an `ant auth login` profile)
 *   node src/run.ts --go --runs 1 --tasks faq,sign-up
 *
 * Runs go one at a time, so the rate limit is never the variable, and each is written to the
 * results file as it finishes, so a stopped run keeps what it did.
 */
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { CONDITIONS, runOne, type RunResult } from "./loop.ts";
import { report, type ResultsFile } from "./report.ts";
import { TASKS } from "./tasks.ts";

const { values } = parseArgs({
  options: {
    go: { type: "boolean", default: false },
    runs: { type: "string", default: "3" },
    tasks: { type: "string" },
    model: { type: "string", default: "claude-opus-5-5" },
  },
});

const runs = Number(values.runs);
const tasks = values.tasks ? TASKS.filter((t) => values.tasks!.split(",").includes(t.id)) : TASKS;
const total = tasks.length * CONDITIONS.length * runs;

console.log(`${tasks.length} tasks × ${CONDITIONS.length} conditions × ${runs} runs = ${total} runs on ${values.model}.`);
if (!values.go) {
  console.log("Nothing sent. Add --go to run it; each run is a few requests.");
  process.exit(0);
}

const client = new Anthropic();
const send = (params: Anthropic.Beta.MessageCreateParamsNonStreaming) => client.beta.messages.create(params);
const startedAt = new Date().toISOString();
const dir = join(import.meta.dirname, "..", "results");
mkdirSync(dir, { recursive: true });
const out = join(dir, `${startedAt.replace(/[:.]/g, "-")}.json`);
const file: ResultsFile = { model: values.model, startedAt, runsPerTask: runs, results: [] as RunResult[] };

let done = 0;
// Conditions alternate within each task and run, so a change in the API over the hours a full
// run takes affects both conditions alike.
for (let run = 1; run <= runs; run++) {
  for (const task of tasks) {
    for (const condition of run % 2 ? CONDITIONS : [...CONDITIONS].reverse()) {
      const result = await runOne(send, task, condition, run, values.model);
      file.results.push(result);
      writeFileSync(out, JSON.stringify(file, null, 2));
      console.log(`${++done}/${total} ${task.id} ${condition} run ${run}: ${result.outcome}, ${result.files.length} files, ${result.turns} turns`);
    }
  }
}

console.log(`\nResults in ${out}\n`);
console.log(report(file));
