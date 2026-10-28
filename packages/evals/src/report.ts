/**
 * Turns a results file into the Markdown table that goes in docs/evals.md. Counts are given with
 * what they are out of, and runs that fell back to another model, were refused or errored are
 * listed rather than averaged in.
 *
 *   node src/report.ts results/<file>.json
 */
import { readFileSync } from "node:fs";
import type { Condition, RunResult } from "./loop.ts";
import { score, type Score } from "./score.ts";
import { TASKS } from "./tasks.ts";

export interface ResultsFile {
  model: string;
  startedAt: string;
  runsPerTask: number;
  results: RunResult[];
}

export interface Scored extends RunResult {
  score: Score;
}

const SCORED = new Set<RunResult["outcome"]>(["finished", "turns"]);

export function scoreAll(results: RunResult[]): Scored[] {
  return results
    .filter((r) => SCORED.has(r.outcome))
    .map((r) => ({ ...r, score: score(r.files, TASKS.find((t) => t.id === r.task)!) }));
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const fixed = (n: number, digits = 1) => n.toFixed(digits);
const share = (count: number, of: number) => `${count} of ${of}`;

interface Summary {
  runs: number;
  clean: number;
  findings: number;
  unknownImports: number;
  unknownProps: number;
  rebuilt: number;
  coverage: number;
  input: number;
  output: number;
  toolCalls: number;
}

export function summarize(scored: Scored[], condition: Condition): Summary {
  const runs = scored.filter((r) => r.condition === condition);
  return {
    runs: runs.length,
    clean: runs.filter((r) => r.score.findings === 0 && r.score.unknownImports.length === 0 && r.score.unknownProps.length === 0).length,
    findings: mean(runs.map((r) => r.score.findings)),
    unknownImports: runs.filter((r) => r.score.unknownImports.length > 0).length,
    unknownProps: runs.filter((r) => r.score.unknownProps.length > 0).length,
    rebuilt: mean(runs.map((r) => r.score.rebuilt.length)),
    coverage: mean(runs.map((r) => r.score.coverage)),
    input: mean(runs.map((r) => r.usage.input)),
    output: mean(runs.map((r) => r.usage.output)),
    toolCalls: mean(runs.map((r) => Object.entries(r.toolCalls).filter(([name]) => name !== "write_file" && name !== "finish").reduce((a, [, n]) => a + n, 0))),
  };
}

export function report(file: ResultsFile): string {
  const scored = scoreAll(file.results);
  const base = summarize(scored, "baseline");
  const mcp = summarize(scored, "mcp");
  const excluded = file.results.filter((r) => !SCORED.has(r.outcome));
  const row = (label: string, a: string, b: string) => `| ${label} | ${a} | ${b} |`;

  const lines = [
    `Model \`${file.model}\`, ${TASKS.length} tasks, ${file.runsPerTask} runs of each per condition, started ${file.startedAt}.`,
    "",
    "| Measure | Without the MCP tools | With them |",
    "| --- | --- | --- |",
    row("Runs scored", String(base.runs), String(mcp.runs)),
    row("Runs with no findings, invented imports or invented props", share(base.clean, base.runs), share(mcp.clean, mcp.runs)),
    row("Audit findings per run (mean)", fixed(base.findings), fixed(mcp.findings)),
    row("Runs importing a component the kit doesn't have", share(base.unknownImports, base.runs), share(mcp.unknownImports, mcp.runs)),
    row("Runs passing a prop a component doesn't have", share(base.unknownProps, base.runs), share(mcp.unknownProps, mcp.runs)),
    row("Native elements rebuilt where the kit has one (mean)", fixed(base.rebuilt), fixed(mcp.rebuilt)),
    row("Expected components used (mean)", `${fixed(base.coverage * 100, 0)}%`, `${fixed(mcp.coverage * 100, 0)}%`),
    row("MCP tool calls per run (mean)", fixed(base.toolCalls), fixed(mcp.toolCalls)),
    row("Input tokens per run (mean)", fixed(base.input, 0), fixed(mcp.input, 0)),
    row("Output tokens per run (mean)", fixed(base.output, 0), fixed(mcp.output, 0)),
    "",
    "| Task | Findings without | Findings with | Coverage without | Coverage with |",
    "| --- | --- | --- | --- | --- |",
    ...TASKS.map((task) => {
      const of = (condition: Condition) => scored.filter((r) => r.task === task.id && r.condition === condition);
      const f = (c: Condition) => fixed(mean(of(c).map((r) => r.score.findings)));
      const cov = (c: Condition) => `${fixed(mean(of(c).map((r) => r.score.coverage)) * 100, 0)}%`;
      return `| ${task.id} | ${f("baseline")} | ${f("mcp")} | ${cov("baseline")} | ${cov("mcp")} |`;
    }),
  ];
  if (excluded.length) {
    lines.push("", `Not scored: ${excluded.map((r) => `${r.task} ${r.condition} run ${r.run} (${r.outcome}${r.error ? `: ${r.error}` : ""})`).join("; ")}.`);
  }
  return lines.join("\n");
}

if (import.meta.main) {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: node src/report.ts results/<file>.json");
  console.log(report(JSON.parse(readFileSync(path, "utf8")) as ResultsFile));
}
