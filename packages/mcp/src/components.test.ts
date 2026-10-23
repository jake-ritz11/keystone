import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPONENT_NAMES, describeComponent, listComponents } from "./components.ts";

test("the list names every component", () => {
  const list = listComponents();
  for (const name of COMPONENT_NAMES) assert.match(list, new RegExp(`^- ${name}: `, "m"));
});

test("a component's reference has its import, every prop and its keyboard model", () => {
  const menu = describeComponent("Menu") ?? "";
  assert.match(menu, /^import \{ Menu, MenuItem, MenuSeparator \} from "@keystone-ui\/ui";$/m);
  assert.match(menu, /^### MenuProps$/m);
  assert.match(menu, /^### MenuItemProps$/m);
  assert.match(menu, /^### Keyboard$/m);
  assert.match(menu, /^- .*Escape.*: /m);
});

test("names match case-insensitively, and by docs slug", () => {
  assert.equal(describeComponent("segmentedcontrol"), describeComponent("SegmentedControl"));
  assert.equal(describeComponent("diff-view"), describeComponent("DiffView"));
});

test("pipes in types don't break the table", () => {
  const button = describeComponent("Button") ?? "";
  const row = button.split("\n").find((line) => line.startsWith("| variant "));
  assert.ok(row);
  assert.equal(row.split(/(?<!\\)\|/).length, 6, row);
});

test("an unknown name gives undefined, so the tool can list the real ones", () => {
  assert.equal(describeComponent("Carousel"), undefined);
});
