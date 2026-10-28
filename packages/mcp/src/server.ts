#!/usr/bin/env node
/**
 * Keystone MCP server (stdio). Gives Claude the design tokens, the component reference and the
 * audit, so it can build with the system and check its own output before handing it over.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { auditComponent, DESCRIPTIONS, getComponent, getTokens, type ToolText } from "./tools.ts";
import { formatFindings } from "./audit.ts";
import { ELEMENTS, GenerateError, SIZES, generateComponent } from "./generate.ts";

const server = new McpServer({ name: "keystone", version: "0.0.0" });

const reply = ({ text, isError }: ToolText) => ({ content: [{ type: "text" as const, text }], ...(isError ? { isError } : {}) });

server.registerTool("get_tokens", { title: "Get design tokens", description: DESCRIPTIONS.get_tokens, inputSchema: {} }, async () => reply(getTokens()));

server.registerTool(
  "get_component",
  {
    title: "Get a component's reference",
    description: DESCRIPTIONS.get_component,
    inputSchema: {
      name: z.string().optional().describe('Component name, e.g. "Dialog" or "SegmentedControl"'),
    },
  },
  async ({ name }) => reply(getComponent(name)),
);

server.registerTool(
  "audit_component",
  {
    title: "Audit a component",
    description: DESCRIPTIONS.audit_component,
    inputSchema: {
      filename: z.string().describe("File name with extension, e.g. Card.module.css or Card.tsx"),
      source: z.string().describe("The file's full contents"),
    },
  },
  async ({ filename, source }) => reply(auditComponent(filename, source)),
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
