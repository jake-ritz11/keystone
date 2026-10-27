/**
 * How each component is tested, read from the tests and the screen-reader checklist at build
 * time rather than written by hand, so a docs page can't claim coverage that doesn't exist.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "..", "..");

/** Which component each checklist ID prefix belongs to. "S" checks are the site, not a component. */
export const CHECK_PREFIXES: Record<string, string | null> = {
  S: null,
  I: "input",
  SE: "select",
  D: "dialog",
  M: "menu",
  T: "tabs",
  CB: "checkbox",
  SW: "switch",
  RG: "radio-group",
  SL: "slider",
  PR: "progress",
  CM: "command-menu",
  TT: "tooltip",
  TO: "toast",
};

export type CheckStatus = "pass" | "odd" | "broken" | "unchecked";

export interface CheckResult {
  id: string;
  automated: boolean;
  status: CheckStatus;
}

const STATUS: Record<string, CheckStatus> = { "✅": "pass", "⚠️": "odd", "❌": "broken", "⬜": "unchecked" };

/** "S2–S4" or "CB1, CB2" as the IDs they name. */
export function expandIds(cell: string): string[] {
  return cell.split(",").flatMap((part) => {
    const range = /^([A-Z]+)(\d+)[–-]([A-Z]+)?(\d+)$/.exec(part.trim());
    if (!range) return [part.trim()];
    const [, prefix, from, , to] = range;
    return Array.from({ length: Number(to) - Number(from) + 1 }, (_, i) => `${prefix}${Number(from) + i}`);
  });
}

/** Every row of the checklist's results table. */
export function parseResults(markdown: string): CheckResult[] {
  const results = markdown.slice(markdown.indexOf("## Results"));
  return results
    .split("\n")
    .filter((line) => /^\| [A-Z]+\d/.test(line))
    .flatMap((line) => {
      const [ids = "", how = "", status = ""] = line.split("|").slice(1).map((c) => c.trim());
      return expandIds(ids).map((id) => ({ id, automated: how === "auto", status: STATUS[status] ?? "unchecked" }));
    });
}

export const prefixOf = (id: string) => /^[A-Z]+/.exec(id)?.[0] ?? "";

export interface Testing {
  /** Playwright spec files that open the component's page. */
  specs: string[];
  /** Its screen-reader checks, from the checklist. */
  checks: CheckResult[];
}

let cache: { specs: Map<string, string>; results: CheckResult[] } | undefined;

function load() {
  if (cache) return cache;
  const dir = join(ROOT, "apps", "docs", "tests");
  const specs = new Map(
    readdirSync(dir)
      .filter((f) => f.endsWith(".spec.ts"))
      .map((f) => [f, readFileSync(join(dir, f), "utf8")]),
  );
  const results = parseResults(readFileSync(join(ROOT, "docs", "screen-reader-checklist.md"), "utf8"));
  cache = { specs, results };
  return cache;
}

export function testingFor(slug: string): Testing {
  const { specs, results } = load();
  return {
    specs: [...specs].filter(([, text]) => text.includes(`/components/${slug}"`)).map(([file]) => file),
    checks: results.filter((r) => CHECK_PREFIXES[prefixOf(r.id)] === slug),
  };
}
