/**
 * Scores the files one run wrote. Every measure is computed from the text, with no model judging
 * another model, so two people scoring the same files get the same numbers. The cost is that
 * each measure is narrow: none of them says whether the interface is good, only whether it
 * follows the system.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { auditSource, type RuleId } from "@keystone-ui/mcp/audit";
import { api } from "@keystone-ui/ui/docs";
import type { EvalTask } from "./tasks.ts";

export interface WrittenFile {
  path: string;
  contents: string;
}

export interface Score {
  /** Audit findings across every file, the same rules `npm run audit:ui` applies. */
  findings: number;
  findingsByRule: Partial<Record<RuleId, number>>;
  /** Names imported from @keystone-ui/ui. */
  imports: string[];
  /** Names imported from @keystone-ui/ui that it does not export: invented components. */
  unknownImports: string[];
  /** Props passed to a Keystone component that it doesn't document and that aren't DOM or ARIA attributes. */
  unknownProps: string[];
  /** Native elements or roles used where the kit has a component for the job, such as a raw <dialog>. */
  rebuilt: string[];
  /** Share of the task's expected components that were used, from 0 to 1. */
  coverage: number;
}

/** Every value the kit exports, read from its index so a new component counts without editing this. */
const EXPORTS = new Set(
  [...readFileSync(join(import.meta.dirname, "..", "..", "ui", "src", "index.ts"), "utf8").matchAll(/^export \{([^}]+)\}/gm)].flatMap((m) =>
    m[1]!.split(",").map((name) => name.trim()),
  ),
);

/** Documented props for each component, keyed by component name ("DialogProps" documents Dialog). */
const DOCUMENTED = new Map<string, Set<string>>();
for (const entry of Object.values(api)) {
  for (const part of entry.parts) DOCUMENTED.set(part.interface.replace(/Props$/, ""), new Set(part.props.map((p) => p.name)));
}

/**
 * Attributes any component accepts because it spreads native props onto an element. A short list
 * rather than every HTML attribute: an attribute missing here is reported, and the report is
 * read by a person, so a false positive costs a glance.
 */
const NATIVE = new Set(
  (
    "key ref children className style id title role tabIndex hidden lang dir slot disabled type name value defaultValue " +
    "placeholder required readOnly autoFocus autoComplete form min max step checked defaultChecked rows cols maxLength " +
    "minLength pattern inputMode href target rel download htmlFor open spellCheck width height"
  ).split(" "),
);
const isNative = (prop: string) => NATIVE.has(prop) || /^(aria|data)-/.test(prop) || /^on[A-Z]/.test(prop);

/** Where a native element or role stands in for a kit component. */
const REBUILT: [pattern: RegExp, component: string][] = [
  [/<button\b/, "Button"],
  [/<dialog\b/, "Dialog"],
  [/<input\b[^>]*type=["']checkbox["']/, "Checkbox"],
  [/role=["']switch["']/, "Switch"],
  [/<input\b[^>]*type=["']radio["']/, "RadioGroup"],
  [/<input\b[^>]*type=["']range["']/, "Slider"],
  [/<select\b/, "Select"],
  [/role=["']tab["']/, "Tabs"],
  [/role=["']menu["']/, "Menu"],
  [/<details\b/, "Disclosure"],
  [/<progress\b|role=["']progressbar["']/, "Progress"],
];

function imports(source: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@keystone-ui\/ui["']/g)) {
    for (const part of match[1]!.split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]!.trim();
      if (name && !part.trim().startsWith("type ")) names.push(name);
    }
  }
  return names;
}

/** Props on each JSX use of a kit component, e.g. `<Button variant="ghost" loading>`. */
function unknownProps(source: string, used: Set<string>): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(/<([A-Z]\w*)\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})*)\/?>/g)) {
    const [, tag, attrs] = match;
    const documented = DOCUMENTED.get(tag!);
    if (!used.has(tag!) || !documented) continue;
    // Attribute names only: values are stripped first, so a word inside a string isn't read as a prop.
    const bare = attrs!.replace(/"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
    for (const [, prop] of bare.matchAll(/(?:^|\s)([A-Za-z][\w-]*)(?==|\s|$)/g)) {
      if (!documented.has(prop!) && !isNative(prop!)) found.push(`${tag}.${prop}`);
    }
  }
  return found;
}

export function score(files: WrittenFile[], task: EvalTask): Score {
  const findings = files.flatMap((f) => auditSource(f.path, f.contents));
  const findingsByRule: Score["findingsByRule"] = {};
  for (const f of findings) findingsByRule[f.rule] = (findingsByRule[f.rule] ?? 0) + 1;

  const code = files.filter((f) => /\.[jt]sx?$/.test(f.path));
  const imported = [...new Set(code.flatMap((f) => imports(f.contents)))];
  const known = new Set(imported.filter((name) => EXPORTS.has(name)));
  const rebuilt = [...new Set(code.flatMap((f) => REBUILT.filter(([pattern]) => pattern.test(f.contents)).map(([, component]) => component)))];

  return {
    findings: findings.length,
    findingsByRule,
    imports: imported,
    unknownImports: imported.filter((name) => !EXPORTS.has(name)),
    unknownProps: code.flatMap((f) => unknownProps(f.contents, known)),
    rebuilt,
    coverage: task.expects.filter((options) => options.some((name) => known.has(name))).length / task.expects.length,
  };
}
