/**
 * Static checks that hold a component to the design system. Each rule is a
 * regex pass over one file's text: fast, dependency-free, and easy for Claude to
 * explain back to the person reading the report.
 */

export interface Finding {
  rule: RuleId;
  file: string;
  line: number;
  message: string;
}

export type RuleId =
  | "hard-coded-color"
  | "off-scale-spacing"
  | "missing-focus-visible"
  | "missing-reduced-motion"
  | "clickable-non-button";

export const RULES: Record<RuleId, string> = {
  "hard-coded-color":
    "Colors come from --ks-color-* tokens, never hex, rgb() or hsl() literals, and never --ks-palette-* " +
    "steps, which don't change with the theme or high contrast.",
  "off-scale-spacing": "Padding, margin and gap use --ks-space-* tokens, never raw px.",
  "missing-focus-visible": "Anything with cursor: pointer has a :focus-visible style.",
  "missing-reduced-motion": "Transitions and animations have a prefers-reduced-motion fallback.",
  "clickable-non-button": "A div or span with onClick needs a role and keyboard handling; prefer <button>.",
};

// A palette step is as fixed as a literal: it skips the theme and high contrast.
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(|--ks-palette-/;
const RAW_SPACING =
  /(?:^|[\s{;])(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)?\s*:[^;}]*\b(?!0px)\d+(?:\.\d+)?px/;

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

function auditCss(file: string, text: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split("\n");

  lines.forEach((content, i) => {
    if (content.trim().startsWith("--")) return;
    if (COLOR_LITERAL.test(content)) {
      findings.push({ rule: "hard-coded-color", file, line: i + 1, message: content.trim() });
    }
    if (RAW_SPACING.test(content)) {
      findings.push({ rule: "off-scale-spacing", file, line: i + 1, message: content.trim() });
    }
  });

  const pointer = text.search(/cursor\s*:\s*pointer/);
  if (pointer !== -1 && !text.includes(":focus-visible")) {
    findings.push({
      rule: "missing-focus-visible",
      file,
      line: lineOf(text, pointer),
      message: "cursor: pointer with no :focus-visible rule in this file",
    });
  }

  const moving = text.search(/\b(?:transition|animation)\s*:/);
  if (moving !== -1 && !text.includes("prefers-reduced-motion")) {
    findings.push({
      rule: "missing-reduced-motion",
      file,
      line: lineOf(text, moving),
      message: "motion with no prefers-reduced-motion block in this file",
    });
  }

  return findings;
}

function auditTsx(file: string, text: string): Finding[] {
  const findings: Finding[] = [];

  for (const match of text.matchAll(/<(div|span)\b[^>]*\bonClick\b[^>]*>/g)) {
    if (!/\brole=/.test(match[0])) {
      findings.push({
        rule: "clickable-non-button",
        file,
        line: lineOf(text, match.index),
        message: `<${match[1]} onClick> without a role`,
      });
    }
  }

  for (const match of text.matchAll(/style=\{\{[^}]*\}\}/g)) {
    if (COLOR_LITERAL.test(match[0])) {
      findings.push({
        rule: "hard-coded-color",
        file,
        line: lineOf(text, match.index),
        message: "color literal in an inline style",
      });
    }
  }

  return findings;
}

/** Audits one file's contents. The file name picks the rule set (.css or .tsx/.jsx). */
export function auditSource(file: string, text: string): Finding[] {
  if (file.endsWith(".css")) return auditCss(file, text);
  if (file.endsWith(".tsx") || file.endsWith(".jsx")) return auditTsx(file, text);
  return [];
}

export function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) return "No findings.";
  return findings
    .map((f) => `${f.file}:${f.line}  [${f.rule}] ${f.message}\n    rule: ${RULES[f.rule]}`)
    .join("\n");
}
