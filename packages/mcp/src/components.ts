/**
 * The component reference as text for Claude: what to reach for, and how to use it correctly.
 * Built from the same data the docs pages render, so the two can't disagree.
 */
import { api, COMPONENTS, type PropsPart } from "@keystone-ui/ui/docs";

export const COMPONENT_NAMES = COMPONENTS.map((c) => c.name);

const cell = (text: string) => text.replace(/\|/g, "\\|");

function propsTable(part: PropsPart): string {
  const rows = part.props.map((p) => {
    const name = p.required ? `${p.name} (required)` : p.name;
    return `| ${name} | \`${cell(p.type)}\` | ${p.default ? `\`${cell(p.default)}\`` : ""} | ${cell(p.description)} |`;
  });
  return [
    `### ${part.interface}`,
    part.extends ? `Also accepts ${part.extends}.` : "",
    part.note ?? "",
    "| Prop | Type | Default | Notes |",
    "| --- | --- | --- | --- |",
    ...rows,
  ]
    .filter(Boolean)
    .join("\n");
}

/** One line per component, for choosing which to use. */
export function listComponents(): string {
  return [
    'Keystone components, all exported from "@keystone-ui/ui". Call get_component with a name for its props and keyboard model.',
    ...COMPONENTS.map((c) => `- ${c.name}: ${c.summary}`),
  ].join("\n");
}

/** The full reference for one component, or undefined if there's no such component. */
export function describeComponent(name: string): string | undefined {
  const entry = COMPONENTS.find((c) => c.name.toLowerCase() === name.trim().toLowerCase() || c.slug === name.trim());
  if (!entry) return undefined;
  const { parts, keyboard } = api[entry.slug] ?? { parts: [] };
  return [
    `## ${entry.name}`,
    entry.summary,
    `import { ${entry.imports.join(", ")} } from "@keystone-ui/ui";`,
    ...parts.map(propsTable),
    keyboard?.length
      ? ["### Keyboard", "Built in; don't add your own handlers for these.", ...keyboard.map((k) => `- ${k.keys}: ${k.action}`)].join("\n")
      : "",
    `Source: ${parts.map((p) => p.source).filter((s, i, all) => all.indexOf(s) === i).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
