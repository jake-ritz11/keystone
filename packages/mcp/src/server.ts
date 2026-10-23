#!/usr/bin/env node
/**
 * Keystone MCP server (stdio). Gives Claude the design tokens, the component reference and the
 * audit, so it can build with the system and check its own output before handing it over.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { color, font, motion, radius, space, cssVariables } from "@keystone-ui/tokens";
import { describeComponent, listComponents } from "./components.ts";
import { auditSource, formatFindings, RULES } from "./audit.ts";
import { ELEMENTS, GenerateError, SIZES, generateComponent } from "./generate.ts";

const server = new McpServer({ name: "keystone", version: "0.0.0" });

server.registerTool(
  "get_tokens",
  {
    title: "Get design tokens",
    description:
      "Returns every Keystone design token (color for light and dark, space, radius, font, motion) " +
      "with its CSS variable name. Use these variables instead of raw values in any component.",
    inputSchema: {},
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { tokens: { color, space, radius, font, motion }, cssVariables: cssVariables("light") },
          null,
          2,
        ),
      },
    ],
  }),
);

server.registerTool(
  "get_component",
  {
    title: "Get a component's reference",
    description:
      "Explains how to use a Keystone component: what it's for, what to import, every prop with " +
      "its type, default and why it exists, and the keyboard behavior it already handles. Leave " +
      "out the name to list every component. Reach for an existing component before writing a new one.",
    inputSchema: {
      name: z.string().optional().describe('Component name, e.g. "Dialog" or "SegmentedControl"'),
    },
  },
  async ({ name }) => {
    if (!name) return { content: [{ type: "text", text: listComponents() }] };
    const text = describeComponent(name);
    if (text) return { content: [{ type: "text", text }] };
    return { content: [{ type: "text", text: `No component named "${name}".

${listComponents()}` }], isError: true };
  },
);

server.registerTool(
  "audit_component",
  {
    title: "Audit a component",
    description:
      "Checks one component file (CSS, TSX or JSX) against the Keystone rules: tokens only for " +
      "color and spacing, a focus-visible style, a reduced-motion fallback, and real buttons " +
      `for click targets. Rules: ${Object.values(RULES).join(" ")}`,
    inputSchema: {
      filename: z.string().describe("File name with extension, e.g. Card.module.css or Card.tsx"),
      source: z.string().describe("The file's full contents"),
    },
  },
  async ({ filename, source }) => ({
    content: [{ type: "text", text: formatFindings(auditSource(filename, source)) }],
  }),
);

server.registerTool(
  "generate_component",
  {
    title: "Generate a component",
    description:
      "Scaffolds a Keystone component (TSX and CSS module) that follows the rules by construction: " +
      "tokens only, forwarded ref, native props spread, and focus-visible plus reduced-motion styles " +
      "for interactive elements. Returns the files, the index.ts export lines, the audit result and " +
      "next steps. It doesn't write to disk; write the files yourself, then do the design work.",
    inputSchema: {
      name: z.string().describe('PascalCase component name, e.g. "Badge" or "IconButton"'),
      element: z.enum(ELEMENTS).describe("The root element. Use button for actions and a for navigation."),
      variants: z.array(z.string()).optional().describe("camelCase variant ids; the first is the default"),
      sizes: z.array(z.enum(SIZES)).optional().describe("Size steps to support"),
      description: z.string().optional().describe("One sentence for the component's doc comment"),
    },
  },
  async (input) => {
    try {
      const out = generateComponent(input);
      const text = [
        ...out.files.map((f) => `--- ${f.path}\n${f.contents}`),
        `--- append to packages/ui/src/index.ts\n${out.exports}`,
        `Audit: ${formatFindings(out.findings)}`,
        `Next steps:\n${out.nextSteps.map((step) => `- ${step}`).join("\n")}`,
      ].join("\n");
      return { content: [{ type: "text", text }] };
    } catch (error) {
      if (!(error instanceof GenerateError)) throw error;
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
  },
);

await server.connect(new StdioServerTransport());
