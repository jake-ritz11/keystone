import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { api } from "./api.ts";

const root = fileURLToPath(new URL("../../../../", import.meta.url));

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

for (const [component, { parts }] of Object.entries(api)) {
  for (const part of parts) {
    test(`${component}: the ${part.interface} table matches the source`, () => {
      const documented = part.props.map((p) => p.name).sort();
      assert.deepEqual(documented, ownProps(part.source, part.interface).sort());
    });
  }
}
