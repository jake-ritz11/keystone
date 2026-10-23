/**
 * Smoke tests for what actually ships: the built dist/ folders, used the way a consumer would.
 * Run after `npm run build:packages`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";

const ROOT = join(import.meta.dirname, "..");
const TOKENS = join(ROOT, "packages", "tokens", "dist");
const UI = join(ROOT, "packages", "ui", "dist");

function exportedFiles(dist: string): string[] {
  const manifest = JSON.parse(readFileSync(join(dist, "package.json"), "utf8")) as { exports: Record<string, unknown> };
  return Object.values(manifest.exports).flatMap((target) =>
    typeof target === "string" ? [target] : Object.values(target as Record<string, string>),
  );
}

test("every file the manifests export exists", () => {
  for (const dist of [TOKENS, UI]) {
    for (const file of exportedFiles(dist)) assert.ok(existsSync(join(dist, file)), `${dist}: missing ${file}`);
  }
});

test("tokens.css is the stylesheet the tokens module generates", async () => {
  const tokens = (await import(pathToFileURL(join(TOKENS, "index.js")).href)) as { tokenStylesheet: () => string };
  assert.equal(readFileSync(join(TOKENS, "tokens.css"), "utf8").trim(), tokens.tokenStylesheet().trim());
});

test("components render on the server, and every class they use is in styles.css", async () => {
  const ui = (await import(pathToFileURL(join(UI, "index.js")).href)) as Record<string, (props: Record<string, unknown>) => unknown>;
  const css = readFileSync(join(UI, "styles.css"), "utf8");
  const tree = h(
    ui.ToastProvider as never,
    null,
    h(ui.Button as never, { variant: "secondary", size: "sm" }, "Save"),
    h(ui.Input as never, { label: "Name", hint: "Hint", error: "Error" }),
    h(ui.Select as never, { label: "Plan", placeholder: "Choose" }, h("option", { value: "a" }, "A")),
    h(ui.Dialog as never, { open: false, onOpenChange: () => {}, title: "Title", footer: "Footer" }, "Body"),
    h(ui.Menu as never, { trigger: h(ui.Button as never, null, "Actions") }, h(ui.MenuItem as never, null, "Rename")),
    h(
      ui.Tabs as never,
      { defaultValue: "a", variant: "segmented" },
      h(ui.TabList as never, { "aria-label": "Tabs" }, h(ui.Tab as never, { value: "a" }, "A")),
      h(ui.TabPanel as never, { value: "a" }, "Panel"),
    ),
    h(ui.Tooltip as never, { content: "Tip" }, h(ui.Button as never, null, "Hover")),
  );
  const html = renderToString(tree);
  const classes = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => (m[1] ?? "").split(/\s+/)));
  assert.ok(classes.size > 20, `expected many classes, got ${classes.size}`);
  for (const name of classes) assert.ok(css.includes(`.${name}`), `class ${name} has no rule in styles.css`);
});

test("the type declarations work for a consumer", () => {
  const dir = mkdtempSync(join(tmpdir(), "keystone-consumer-"));
  writeFileSync(
    join(dir, "app.tsx"),
    [
      'import { Button, Dialog, useToast, type ToastOptions } from "@keystone-ui/ui";',
      'import { color, tokenStylesheet } from "@keystone-ui/tokens";',
      'const options: ToastOptions = { title: "Saved", tone: "success" };',
      "export function App() {",
      "  const { toast } = useToast();",
      '  const css: string = tokenStylesheet() + color.light.accent;',
      "  return (",
      "    <>",
      '      <Button variant="primary" onClick={() => toast(options)}>{css}</Button>',
      '      <Dialog open={false} onOpenChange={() => {}} title="T" />',
      "    </>",
      "  );",
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        jsx: "react-jsx",
        module: "ESNext",
        moduleResolution: "Bundler",
        target: "ES2022",
        lib: ["ES2022", "DOM"],
        skipLibCheck: false,
        types: [],
        typeRoots: [join(ROOT, "node_modules", "@types")],
        paths: {
          "@keystone-ui/ui": [join(UI, "types", "index.d.ts")],
          "@keystone-ui/tokens": [join(TOKENS, "types", "index.d.ts")],
          react: [join(ROOT, "node_modules", "@types", "react")],
          "react/jsx-runtime": [join(ROOT, "node_modules", "@types", "react", "jsx-runtime")],
        },
      },
      files: ["app.tsx"],
    }),
  );
  const tsc = join(ROOT, "node_modules", "typescript", "bin", "tsc");
  try {
    execFileSync(process.execPath, [tsc, "-p", join(dir, "tsconfig.json")], { encoding: "utf8" });
  } catch (error) {
    assert.fail(`consumer typecheck failed:\n${(error as { stdout?: string }).stdout ?? error}`);
  }
});

/**
 * Gzipped size budgets for what ships, about 15% above the size when they were set. Going over
 * isn't wrong, but it should be a decision: raise the number in the same commit and say why.
 */
const BUDGETS: [dist: string, file: string, kB: number][] = [
  [UI, "index.js", 13],
  [UI, "styles.css", 5.5],
  [TOKENS, "index.js", 1.5],
  [TOKENS, "tokens.css", 1],
];

test("shipped files stay inside their gzipped size budgets", () => {
  for (const [dist, file, kB] of BUDGETS) {
    const size = gzipSync(readFileSync(join(dist, file))).length / 1000;
    assert.ok(size <= kB, `${join(dist, file)} is ${size.toFixed(1)} kB gzipped, over its ${kB} kB budget`);
  }
});
