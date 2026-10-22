#!/usr/bin/env node
/**
 * Keystone MCP server (stdio). Gives Claude the design tokens and the audit, so it can
 * build components from the system and check its own output before handing it over.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { color, font, motion, radius, space, cssVariables } from "@keystone-ui/tokens";
import { auditSource, formatFindings, RULES } from "./audit.ts";

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

await server.connect(new StdioServerTransport());
