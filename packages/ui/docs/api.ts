/**
 * The component reference the docs site renders and the MCP server hands to Claude. The prose
 * is hand-written in spec.ts; the props tables are generated from the component sources and
 * their JSDoc into props.generated.ts, so editors' hovers and the docs read the same words.
 */
import { PROPS } from "./props.generated.ts";
import { spec, type ComponentSpec, type KeyDoc, type PartSpec } from "./spec.ts";
import type { PropDoc } from "./props.ts";

export { CATEGORIES, COMPONENTS, type ComponentCategory, type ComponentSummary } from "./spec.ts";
export type { KeyDoc, PropDoc };

export interface PropsPart extends PartSpec {
  props: PropDoc[];
}

export interface ComponentApi extends Omit<ComponentSpec, "parts"> {
  parts: PropsPart[];
}

export const api: Record<string, ComponentApi> = Object.fromEntries(
  Object.entries(spec).map(([slug, component]) => [
    slug,
    { ...component, parts: component.parts.map((part) => ({ ...part, props: PROPS[part.interface] ?? [] })) },
  ]),
);
