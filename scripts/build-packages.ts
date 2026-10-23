/**
 * Builds the publishable form of @keystone-ui/tokens and @keystone-ui/ui into each package's
 * dist/. In the repo the packages are consumed as TypeScript source; what goes to npm is plain
 * ESM, type declarations, and CSS, so it works in any React setup without extra config.
 *
 * Publish from the dist folder: `npm publish packages/ui/dist`.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
import { tokenStylesheet } from "../packages/tokens/src/index.ts";

const ROOT = join(import.meta.dirname, "..");
const REPO = "https://github.com/jake-ritz11/keystone";

interface Manifest {
  name: string;
  version: string;
  description: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

const read = (path: string): Manifest => JSON.parse(readFileSync(path, "utf8")) as Manifest;
const license = existsSync(join(ROOT, "LICENSE"))
  ? readFileSync(join(ROOT, "LICENSE"), "utf8").split("\n")[0]?.replace(/ License$/, "").trim()
  : undefined;

function declarations(pkg: string): void {
  const tsc = join(ROOT, "node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tsc, "-p", join(ROOT, "packages", pkg, "tsconfig.build.json")], { stdio: "inherit" });
}

/** The package.json that ships, pointing at compiled files instead of source. */
function manifest(source: Manifest, dir: string, exports: Record<string, unknown>, extra: Record<string, unknown> = {}): void {
  const out = {
    name: source.name,
    version: source.version,
    description: source.description,
    license: license ?? "UNLICENSED",
    repository: { type: "git", url: `git+${REPO}.git`, directory: dir },
    homepage: REPO,
    type: "module",
    sideEffects: ["*.css"],
    exports,
    ...extra,
  };
  writeFileSync(join(ROOT, dir, "dist", "package.json"), `${JSON.stringify(out, null, 2)}\n`);
  const readme = join(ROOT, dir, "README.md");
  if (existsSync(readme)) copyFileSync(readme, join(ROOT, dir, "dist", "README.md"));
  if (existsSync(join(ROOT, "LICENSE"))) copyFileSync(join(ROOT, "LICENSE"), join(ROOT, dir, "dist", "LICENSE"));
}

async function buildTokens(): Promise<void> {
  const dir = "packages/tokens";
  const dist = join(ROOT, dir, "dist");
  rmSync(dist, { recursive: true, force: true });
  await build({
    entryPoints: [join(ROOT, dir, "src", "index.ts")],
    outfile: join(dist, "index.js"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2022",
  });
  declarations("tokens");
  writeFileSync(join(dist, "tokens.css"), `${tokenStylesheet()}\n`);
  manifest(read(join(ROOT, dir, "package.json")), dir, {
    ".": { types: "./types/index.d.ts", import: "./index.js" },
    "./tokens.css": "./tokens.css",
  });
}

async function buildUi(): Promise<void> {
  const dir = "packages/ui";
  const dist = join(ROOT, dir, "dist");
  const source = read(join(ROOT, dir, "package.json"));
  rmSync(dist, { recursive: true, force: true });
  await build({
    entryPoints: [join(ROOT, dir, "src", "index.ts")],
    outdir: dist,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    external: ["react", "react-dom", "react/jsx-runtime", "@keystone-ui/tokens"],
    // Scoped class names in the JS, one stylesheet for every component.
    loader: { ".module.css": "local-css" },
    // One bundle loses the per-file directives, so mark the whole entry as client code.
    // Server components can still render every component.
    banner: { js: '"use client";' },
    logOverride: { "unsupported-directive": "silent" },
  });
  renameSync(join(dist, "index.css"), join(dist, "styles.css"));
  declarations("ui");
  manifest(
    source,
    dir,
    {
      ".": { types: "./types/index.d.ts", import: "./index.js" },
      "./styles.css": "./styles.css",
    },
    { dependencies: source.dependencies, peerDependencies: source.peerDependencies },
  );
}

await buildTokens();
await buildUi();
if (!license) console.warn("No LICENSE at the repo root: the packages are marked UNLICENSED.");
console.log("Built packages/tokens/dist and packages/ui/dist.");
