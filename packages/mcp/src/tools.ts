/**
 * What the read and check tools return, apart from the MCP transport. The server registers these,
 * and the eval harness (packages/evals) hands the same text to the model, so an eval measures the
 * server Claude Code actually talks to.
 */
import { color, font, motion, radius, space, target, cssVariables, highContrast } from "@keystone-ui/tokens";
import { describeComponent, listComponents } from "./components.ts";
import { auditSource, formatFindings, RULES } from "./audit.ts";

export interface ToolText {
  text: string;
  isError?: boolean;
}

export const DESCRIPTIONS = {
  get_tokens:
    "Returns every Keystone design token (color for light and dark, space, target sizes, radius, font, motion) " +
    "with its CSS variable name. Use these variables instead of raw values in any component. " +
    "Use only --ks-color-* in components, never --ks-palette-*: the semantic names are what change " +
    "with the theme and with high contrast. Outlines that identify a control use border-control.",
  get_component:
    "Explains how to use a Keystone component: what it's for, what to import, every prop with " +
    "its type, default and why it exists, and the keyboard behavior it already handles. Leave " +
    "out the name to list every component. Reach for an existing component before writing a new one.",
  audit_component:
    "Checks one component file (CSS, TSX or JSX) against the Keystone rules: tokens only for " +
    "color and spacing, a focus-visible style, a reduced-motion fallback, and real buttons " +
    `for click targets. Rules: ${Object.values(RULES).join(" ")}`,
} as const;

export function getTokens(): ToolText {
  return {
    text: JSON.stringify(
      { tokens: { color, space, target, radius, font, motion }, highContrastChanges: highContrast, cssVariables: cssVariables("light") },
      null,
      2,
    ),
  };
}

export function getComponent(name?: string): ToolText {
  if (!name) return { text: listComponents() };
  const text = describeComponent(name);
  if (text) return { text };
  return { text: `No component named "${name}".\n\n${listComponents()}`, isError: true };
}

export function auditComponent(filename: string, source: string): ToolText {
  return { text: formatFindings(auditSource(filename, source)) };
}
