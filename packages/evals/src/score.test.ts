import { test } from "node:test";
import assert from "node:assert/strict";
import { score } from "./score.ts";
import { TASKS } from "./tasks.ts";

const task = TASKS.find((t) => t.id === "delete-confirm")!;

const good = [
  {
    path: "DeleteProject.tsx",
    contents: `"use client";
import { useState } from "react";
import { Button, Dialog } from "@keystone-ui/ui";
import styles from "./DeleteProject.module.css";

export function DeleteProject() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.row}>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete project</Button>
      <Dialog open={open} onOpenChange={setOpen} title="Delete this project?" aria-describedby="x">
        <Button variant="danger" onClick={() => setOpen(false)}>Delete project</Button>
      </Dialog>
    </div>
  );
}`,
  },
  { path: "DeleteProject.module.css", contents: ".row { display: flex; gap: var(--ks-space-2); }" },
];

test("a kit-based answer that follows the rules scores clean", () => {
  const result = score(good, task);
  assert.equal(result.findings, 0);
  assert.deepEqual(result.imports, ["Button", "Dialog"]);
  assert.deepEqual(result.unknownImports, []);
  assert.deepEqual(result.unknownProps, []);
  assert.deepEqual(result.rebuilt, []);
  assert.equal(result.coverage, 1);
});

test("raw values, rebuilt elements, invented components and props are each counted", () => {
  const result = score(
    [
      {
        path: "Delete.tsx",
        contents: `import { Button, ConfirmModal } from "@keystone-ui/ui";
export const Delete = () => (
  <div onClick={() => {}}>
    <Button variant="danger" tone="loud" size="sm">Delete</Button>
    <dialog open><button>Yes</button></dialog>
  </div>
);`,
      },
      { path: "Delete.module.css", contents: ".a { color: #c00; padding: 12px; cursor: pointer; }" },
    ],
    task,
  );
  assert.equal(result.findingsByRule["hard-coded-color"], 1);
  assert.equal(result.findingsByRule["off-scale-spacing"], 1);
  assert.equal(result.findingsByRule["missing-focus-visible"], 1);
  assert.equal(result.findingsByRule["clickable-non-button"], 1);
  assert.deepEqual(result.unknownImports, ["ConfirmModal"]);
  assert.deepEqual(result.unknownProps, ["Button.tone"]);
  assert.deepEqual(result.rebuilt.sort(), ["Button", "Dialog"]);
  // Button was used, Dialog wasn't.
  assert.equal(result.coverage, 0.5);
});

test("words inside attribute values aren't read as props", () => {
  const result = score([{ path: "A.tsx", contents: `import { Button } from "@keystone-ui/ui";\nconst a = <Button title="variant loud" onClick={() => go({ tone: 1 })}>Go</Button>;` }], task);
  assert.deepEqual(result.unknownProps, []);
});

test("one alternative is enough to cover an expectation", () => {
  const settings = TASKS.find((t) => t.id === "notification-settings")!;
  const result = score([{ path: "S.tsx", contents: `import { Checkbox, Select, Button } from "@keystone-ui/ui";` }], settings);
  assert.equal(result.coverage, 1);
});
