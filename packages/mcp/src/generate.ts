/**
 * Scaffolds a Keystone component that follows the house rules by construction: tokens only,
 * a forwarded ref, native props spread through, and, for interactive elements, a
 * :focus-visible style and a reduced-motion fallback. The output is audited before it's
 * returned, so the starting point is always clean; the design work is still the caller's.
 */
import { auditSource, type Finding } from "./audit.ts";

export const ELEMENTS = ["button", "a", "div", "span", "section", "article", "li"] as const;
export type ElementName = (typeof ELEMENTS)[number];

export const SIZES = ["sm", "md", "lg"] as const;
export type SizeName = (typeof SIZES)[number];

export interface GenerateInput {
  /** PascalCase, e.g. "Badge" or "IconButton". */
  name: string;
  element: ElementName;
  /** camelCase variant ids. The first one is the default. */
  variants?: string[];
  /** Size steps to support; empty for none. */
  sizes?: SizeName[];
  description?: string;
}

export interface GeneratedFile {
  path: string;
  contents: string;
}

export interface GenerateOutput {
  files: GeneratedFile[];
  /** Lines to append to packages/ui/src/index.ts. */
  exports: string;
  findings: Finding[];
  nextSteps: string[];
}

const TYPES: Record<ElementName, { attrs: string; el: string }> = {
  button: { attrs: "ButtonHTMLAttributes<HTMLButtonElement>", el: "HTMLButtonElement" },
  a: { attrs: "AnchorHTMLAttributes<HTMLAnchorElement>", el: "HTMLAnchorElement" },
  div: { attrs: "HTMLAttributes<HTMLDivElement>", el: "HTMLDivElement" },
  span: { attrs: "HTMLAttributes<HTMLSpanElement>", el: "HTMLSpanElement" },
  section: { attrs: "HTMLAttributes<HTMLElement>", el: "HTMLElement" },
  article: { attrs: "HTMLAttributes<HTMLElement>", el: "HTMLElement" },
  li: { attrs: "LiHTMLAttributes<HTMLLIElement>", el: "HTMLLIElement" },
};

const RESERVED = new Set(["root", ...SIZES]);

const SIZE_CSS: Record<SizeName, string> = {
  sm: "  padding: var(--ks-space-1) var(--ks-space-2);\n  font-size: var(--ks-font-size-xs);",
  md: "  padding: var(--ks-space-2) var(--ks-space-3);\n  font-size: var(--ks-font-size-sm);",
  lg: "  padding: var(--ks-space-3) var(--ks-space-4);\n  font-size: var(--ks-font-size-md);",
};

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const union = (values: string[]) => values.map((v) => JSON.stringify(v)).join(" | ");

export class GenerateError extends Error {}

function validate({ name, element, variants = [], sizes = [] }: GenerateInput): void {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    throw new GenerateError(`name must be PascalCase, like "Badge" or "IconButton"; got "${name}".`);
  }
  if (!ELEMENTS.includes(element)) {
    throw new GenerateError(`element must be one of ${ELEMENTS.join(", ")}; got "${element}".`);
  }
  for (const variant of variants) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(variant)) {
      throw new GenerateError(`variant ids are camelCase CSS class names; "${variant}" isn't one.`);
    }
    if (RESERVED.has(variant)) {
      throw new GenerateError(`"${variant}" is reserved for the root or a size class; pick another variant id.`);
    }
  }
  if (new Set(variants).size !== variants.length) throw new GenerateError("variant ids must be unique.");
  for (const size of sizes) {
    if (!SIZES.includes(size)) throw new GenerateError(`sizes must come from ${SIZES.join(", ")}; got "${size}".`);
  }
}

function tsx(input: GenerateInput): string {
  const { name, element, variants = [], sizes = [], description } = input;
  const { attrs, el } = TYPES[element];
  const attrsType = attrs.slice(0, attrs.indexOf("<"));
  const props: string[] = [];
  const params: string[] = [];
  const classes = ["styles.root"];
  const types: string[] = [];

  if (variants.length > 0) {
    types.push(`export type ${name}Variant = ${union(variants)};`);
    props.push(`  variant?: ${name}Variant;`);
    params.push(`variant = ${JSON.stringify(variants[0])}`);
    classes.push("styles[variant]");
  }
  if (sizes.length > 0) {
    const fallback = sizes.includes("md") ? "md" : sizes[0];
    types.push(`export type ${name}Size = ${union(sizes)};`);
    props.push(`  size?: ${name}Size;`);
    params.push(`size = ${JSON.stringify(fallback)}`);
    classes.push("styles[size]");
  }
  params.push("className", "...rest");
  classes.push("className");

  const body = props.length > 0 ? ` {\n${props.join("\n")}\n}` : " {}";
  const typeAttr = element === "button" ? ' type="button"' : "";
  const doc = description ? `/** ${description.replace(/\*\//g, "* /")} */\n` : "";

  return `import { forwardRef, type ${attrsType} } from "react";
import styles from "./${name}.module.css";
${types.length > 0 ? `\n${types.join("\n")}\n` : ""}
export interface ${name}Props extends ${attrs}${body}

${doc}export const ${name} = forwardRef<${el}, ${name}Props>(function ${name}(
  { ${params.join(", ")} },
  ref,
) {
  const classes = [${classes.join(", ")}].filter(Boolean).join(" ");

  return <${element} ref={ref}${typeAttr} className={classes} {...rest} />;
});
`;
}

function css(input: GenerateInput): string {
  const { element, variants = [], sizes = [] } = input;
  const interactive = element === "button" || element === "a";
  const blocks: string[] = [];

  const root = [
    "  display: inline-flex;",
    "  align-items: center;",
    "  gap: var(--ks-space-2);",
    "  border: 1px solid var(--ks-color-border);",
    "  border-radius: var(--ks-radius-md);",
    "  background: var(--ks-color-surface);",
    "  color: var(--ks-color-text);",
    "  font-family: var(--ks-font-family-sans);",
    "  font-weight: var(--ks-font-weight-medium);",
    "  line-height: var(--ks-font-line-height-tight);",
  ];
  if (sizes.length === 0) root.push(SIZE_CSS.md);
  if (element === "a") root.push("  text-decoration: none;");
  if (interactive) {
    root.push(
      "  cursor: pointer;",
      "  transition: background-color var(--ks-motion-duration-fast) var(--ks-motion-easing-standard);",
    );
  }
  blocks.push(`.root {\n${root.join("\n")}\n}`);

  if (interactive) {
    blocks.push(".root:hover {\n  background: var(--ks-color-surface-raised);\n}");
    blocks.push(".root:focus-visible {\n  outline: 2px solid var(--ks-color-focus);\n  outline-offset: 2px;\n}");
  }
  for (const size of sizes) blocks.push(`.${size} {\n${SIZE_CSS[size]}\n}`);
  variants.forEach((variant, i) => {
    const look =
      i === 0
        ? "  /* Default look: inherits .root. */"
        : "  /* Style this variant from --ks-color-* tokens. */\n  border-color: var(--ks-color-accent);";
    blocks.push(`.${variant} {\n${look}\n}`);
  });
  if (interactive) {
    blocks.push("@media (prefers-reduced-motion: reduce) {\n  .root {\n    transition: none;\n  }\n}");
  }
  return `${blocks.join("\n\n")}\n`;
}

export function generateComponent(input: GenerateInput): GenerateOutput {
  validate(input);
  const dir = `packages/ui/src/${kebab(input.name)}`;
  const files: GeneratedFile[] = [
    { path: `${dir}/${input.name}.tsx`, contents: tsx(input) },
    { path: `${dir}/${input.name}.module.css`, contents: css(input) },
  ];
  const typeNames = [
    `${input.name}Props`,
    ...(input.variants?.length ? [`${input.name}Variant`] : []),
    ...(input.sizes?.length ? [`${input.name}Size`] : []),
  ].sort();
  const exports =
    `export { ${input.name} } from "./${kebab(input.name)}/${input.name}";\n` +
    `export type { ${typeNames.join(", ")} } from "./${kebab(input.name)}/${input.name}";\n`;

  return {
    files,
    exports,
    findings: files.flatMap((file) => auditSource(file.path, file.contents)),
    nextSteps: [
      `Write the files, then append the export lines to packages/ui/src/index.ts.`,
      `Replace the placeholder variant styles with real ones, from tokens only.`,
      `If you add event handlers or state, put "use client" at the top of ${input.name}.tsx.`,
      `Add every variant and state to apps/docs/app/page.tsx and check it in light and dark.`,
      `Run audit_component on each file you change, then npm run check.`,
    ],
  };
}
