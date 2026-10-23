import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { api, COMPONENTS } from "./api.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));

/** The props an interface declares itself (not the ones it extends), from the source text. */
function ownProps(source: string, name: string): string[] {
  const text = readFileSync(root + source, "utf8");
  const start = text.search(new RegExp(`interface ${name}\\b`));
  assert.notEqual(start, -1, `${name} not found in ${source}`);
  const open = text.indexOf("{", start);
  const close = text.indexOf("\n}", open);
  const body = text.slice(open + 1, close);
  return [...body.matchAll(/^ {2}"?([\w-]+)"?\??:/gm)].map((m) => m[1] ?? "");
}

test("every component in the list has a reference, and nothing else does", () => {
  assert.deepEqual(Object.keys(api).sort(), COMPONENTS.map((c) => c.slug).sort());
});

test("every import a component lists is a runtime export of the package", () => {
  const index = readFileSync(root + "packages/ui/src/index.ts", "utf8");
  const exported = [...index.matchAll(/^export \{ ([^}]+) \}/gm)].flatMap((m) => (m[1] ?? "").split(", "));
  for (const c of COMPONENTS) for (const name of c.imports) assert.ok(exported.includes(name), `${c.slug}: ${name} isn't exported`);
});

for (const [component, { parts }] of Object.entries(api)) {
  for (const part of parts) {
    test(`${component}: the ${part.interface} table matches the source`, () => {
      const documented = part.props.map((p) => p.name).sort();
      assert.deepEqual(documented, ownProps(part.source, part.interface).sort());
    });
  }
}
