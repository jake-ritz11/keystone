import { test } from "node:test";
import assert from "node:assert/strict";
import { apiTools, parseToolCall, planWrite, runRead } from "./tools.ts";
import { applyChange, normalizePath, PathError, revertChange, type Workspace } from "./workspace.ts";

const ws: Workspace = {
  "index.html": "<h1>Hi</h1>\n<a href=\"abuot.html\">About</a>\n",
  "styles.css": "body { color: black; }\n.a { color: red; }\n.b { color: red; }\n",
};

test("paths normalize, and anything that escapes is refused", () => {
  assert.equal(normalizePath("./index.html"), "index.html");
  assert.equal(normalizePath("/pages\\about.html"), "pages/about.html");
  assert.equal(normalizePath("a//b/./c.css"), "a/b/c.css");
  for (const bad of ["../secret", "a/../../b", "", "   ", "a b.html", "%2e%2e/x", "a/b/c/d/e.css"]) {
    assert.throws(() => normalizePath(bad), PathError, bad);
  }
});

test("tool calls are validated before anything runs", () => {
  assert.equal(parseToolCall("rm_rf", {}).ok, false);
  assert.equal(parseToolCall("read_file", {}).ok, false);
  assert.equal(parseToolCall("read_file", { path: "a", extra: 1 }).ok, false);
  assert.equal(parseToolCall("update_plan", { steps: [] }).ok, false);
  assert.deepEqual(parseToolCall("read_file", { path: "index.html" }), { ok: true, name: "read_file", input: { path: "index.html" } });
});

test("read tools: list, read with line numbers, search", () => {
  assert.match((runRead(ws, "list_files", {}) as { output: string }).output, /index\.html {2}\(\d+ bytes\)/);
  const read = runRead(ws, "read_file", { path: "index.html" });
  assert.ok(read.ok && read.output.startsWith("   1  <h1>Hi</h1>"));
  assert.match((runRead(ws, "read_file", { path: "nope.css" }) as { error: string }).error, /No file at "nope\.css"/);
  const found = runRead(ws, "search", { query: "color: red" });
  assert.ok(found.ok);
  assert.equal(found.output, "styles.css:2: .a { color: red; }\nstyles.css:3: .b { color: red; }");
  assert.equal((runRead(ws, "search", { query: "[", regex: true }) as { ok: boolean }).ok, false);
  assert.equal((runRead(ws, "read_file", { path: "../etc/passwd" }) as { ok: boolean }).ok, false);
});

test("edit_file needs exactly one match, and returns a change without applying it", () => {
  const edit = planWrite(ws, "edit_file", { path: "index.html", old_text: "abuot.html", new_text: "about.html" });
  assert.ok(edit.ok);
  assert.equal(ws["index.html"]?.includes("abuot"), true, "the workspace itself is untouched");
  const next = applyChange(ws, edit.change);
  assert.equal(next["index.html"]?.includes('href="about.html"'), true);
  assert.deepEqual(applyChange(next, revertChange(edit.change)), ws);

  assert.match((planWrite(ws, "edit_file", { path: "styles.css", old_text: "color: red", new_text: "x" }) as { error: string }).error, /appears 2 times/);
  assert.match((planWrite(ws, "edit_file", { path: "styles.css", old_text: "missing", new_text: "x" }) as { error: string }).error, /wasn't found/);
});

test("replacement text with $ patterns is inserted literally", () => {
  const edit = planWrite(ws, "edit_file", { path: "styles.css", old_text: "black", new_text: "$&$1" });
  assert.ok(edit.ok);
  assert.match(edit.change.after ?? "", /color: \$&\$1;/);
});

test("create and delete", () => {
  const create = planWrite(ws, "create_file", { path: "about.html", content: "<h1>About</h1>" });
  assert.ok(create.ok);
  assert.equal(create.change.before, null);
  assert.equal((planWrite(ws, "create_file", { path: "index.html", content: "" }) as { ok: boolean }).ok, false);
  const del = planWrite(ws, "delete_file", { path: "styles.css" });
  assert.ok(del.ok);
  assert.equal(applyChange(ws, del.change)["styles.css"], undefined);
});

test("API definitions: one per tool, plain JSON Schema, eager streaming on the big writes", () => {
  const tools = apiTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), ["create_file", "delete_file", "edit_file", "list_files", "read_file", "search", "update_plan"]);
  for (const tool of tools) {
    assert.equal(tool.input_schema.type, "object");
    assert.equal("$schema" in tool.input_schema, false);
  }
  assert.deepEqual(tools.filter((t) => "eager_input_streaming" in t).map((t) => t.name).sort(), ["create_file", "edit_file"]);
});
