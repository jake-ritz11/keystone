#!/usr/bin/env node
/** Audits every .css/.tsx/.jsx file under the given paths. Exits 1 on any finding. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { auditSource, formatFindings, type Finding } from "./audit.ts";

function walk(path: string, out: string[]): void {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      walk(join(path, entry), out);
    }
  } else if (/\.(css|tsx|jsx)$/.test(path)) {
    out.push(path);
  }
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: keystone-audit <file-or-dir> [...]");
  process.exit(2);
}

const files: string[] = [];
for (const target of targets) walk(target, files);

const findings: Finding[] = files.flatMap((file) =>
  auditSource(relative(process.cwd(), file), readFileSync(file, "utf8")),
);

console.log(formatFindings(findings));
console.log(`\n${files.length} files checked, ${findings.length} findings`);
process.exit(findings.length > 0 ? 1 : 0);
