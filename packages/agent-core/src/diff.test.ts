import { test } from "node:test";
import assert from "node:assert/strict";
import { diffAll, diffHunks, diffStats, unifiedDiff } from "./diff.ts";

const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join("\n") + "\n";

test("identical text has no hunks", () => {
  assert.deepEqual(diffHunks("a\nb\n", "a\nb\n"), []);
});

test("one changed line: a remove then an add, with numbers on both sides", () => {
  const all = diffAll("a\nb\nc\n", "a\nB\nc\n");
  assert.deepEqual(
    all.map((l) => [l.kind, l.text, l.oldLine, l.newLine]),
    [
      ["context", "a", 1, 1],
      ["remove", "b", 2, undefined],
      ["add", "B", undefined, 2],
      ["context", "c", 3, 3],
    ],
  );
});

test("hunks carry three lines of context and merge when close", () => {
  const before = lines(20);
  const after = before.replace("line 5\n", "line five\n").replace("line 8\n", "line eight\n").replace("line 18\n", "");
  const hunks = diffHunks(before, after);
  assert.equal(hunks.length, 2, "5 and 8 merge; 18 is its own hunk");
  assert.deepEqual([hunks[0]!.oldStart, hunks[0]!.oldLines, hunks[0]!.newStart, hunks[0]!.newLines], [2, 10, 2, 10]);
  assert.deepEqual([hunks[1]!.oldStart, hunks[1]!.oldLines, hunks[1]!.newStart, hunks[1]!.newLines], [15, 6, 15, 5]);
});

test("a created file is all additions; a deleted one all removals", () => {
  assert.deepEqual(diffStats({ path: "a", before: null, after: "x\ny\n" }), { added: 2, removed: 0 });
  assert.deepEqual(diffStats({ path: "a", before: "x\ny\n", after: null }), { added: 0, removed: 2 });
  assert.equal(
    unifiedDiff({ path: "new.css", before: null, after: "a {}\n" }),
    "--- /dev/null\n+++ b/new.css\n@@ -0,0 +1,1 @@\n+a {}",
  );
});

test("an insertion in the middle keeps everything else as context", () => {
  const text = unifiedDiff({ path: "s.css", before: "a\nb\nc\n", after: "a\nb\nnew\nc\n" });
  assert.equal(text, "--- a/s.css\n+++ b/s.css\n@@ -1,3 +1,4 @@\n a\n b\n+new\n c");
});

test("the diff reconstructs both sides exactly", () => {
  const before = "header\nkeep 1\nold A\nold B\nkeep 2\nshared\nold C\nfooter\n";
  const after = "header\nkeep 1\nnew A\nkeep 2\nshared\nnew C\nnew D\nfooter\n";
  const all = diffAll(before, after);
  assert.equal(all.filter((l) => l.kind !== "add").map((l) => l.text).join("\n") + "\n", before);
  assert.equal(all.filter((l) => l.kind !== "remove").map((l) => l.text).join("\n") + "\n", after);
});
