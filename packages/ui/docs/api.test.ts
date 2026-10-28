import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generate, OUTPUT } from "../../../scripts/generate-props.ts";
import { api, COMPONENTS } from "./api.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));

test("every component in the list has a reference, and nothing else does", () => {
  assert.deepEqual(Object.keys(api).sort(), COMPONENTS.map((c) => c.slug).sort());
});

test("every import a component lists is a runtime export of the package", () => {
  const index = readFileSync(root + "packages/ui/src/index.ts", "utf8");
  const exported = [...index.matchAll(/^export \{ ([^}]+) \}/gm)].flatMap((m) => (m[1] ?? "").split(", "));
  for (const c of COMPONENTS) for (const name of c.imports) assert.ok(exported.includes(name), `${c.slug}: ${name} isn't exported`);
});

test("props.generated.ts is up to date with the component sources", () => {
  // If this fails, run: node scripts/generate-props.ts
  assert.equal(readFileSync(OUTPUT, "utf8"), generate());
});

for (const [component, { parts }] of Object.entries(api)) {
  for (const part of parts) {
    test(`${component}: every ${part.interface} prop has a description in its JSDoc`, () => {
      assert.ok(part.props.length > 0, `${part.interface} has no props; is the interface name right?`);
      assert.deepEqual(part.props.filter((p) => !p.description).map((p) => p.name), []);
    });
  }
}
