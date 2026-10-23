/**
 * Scripted sessions for the sample tasks. They're written to read like a careful agent at
 * work, and each edit matches the sample site exactly; `replays.test.ts` runs every one
 * through the reducer to prove it.
 */
import type { ScriptedTurn } from "../transport.ts";

const brokenLink: ScriptedTurn[] = [
  {
    stop: "tool_use",
    blocks: [
      { thinking: "Looking for links on the home page that point at files that don't exist." },
      {
        tool: "update_plan",
        input: {
          steps: [
            { title: "Find the link that goes nowhere", status: "in_progress" },
            { title: "Point it at the right page", status: "pending" },
          ],
        },
      },
      { tool: "list_files", input: {} },
      { tool: "search", input: { query: "href=", path: "index.html" } },
    ],
  },
  {
    stop: "tool_use",
    blocks: [
      { text: "The About link in the nav points to `abuot.html`, but the page is `about.html`. That's a typo, so the link 404s." },
      {
        tool: "update_plan",
        input: {
          steps: [
            { title: "Find the link that goes nowhere", status: "done" },
            { title: "Point it at the right page", status: "in_progress" },
          ],
        },
      },
      {
        tool: "edit_file",
        input: { path: "index.html", old_text: '<a href="abuot.html">About</a>', new_text: '<a href="about.html">About</a>' },
      },
    ],
  },
  {
    stop: "tool_use",
    blocks: [
      { thinking: "Checking the other pages don't have the same typo." },
      { tool: "search", input: { query: "abuot" } },
      {
        tool: "update_plan",
        input: {
          steps: [
            { title: "Find the link that goes nowhere", status: "done" },
            { title: "Point it at the right page", status: "done" },
          ],
        },
      },
    ],
  },
  {
    stop: "end_turn",
    blocks: [
      {
        text: "Fixed the About link on the home page: it pointed to `abuot.html`, a typo for `about.html`. No other page had the same mistake.",
      },
    ],
  },
];

const pricingMobile: ScriptedTurn[] = [
  {
    stop: "tool_use",
    blocks: [
      { thinking: "Reading the pricing markup and the styles it uses." },
      {
        tool: "update_plan",
        input: {
          steps: [
            { title: "Find why the table overflows", status: "in_progress" },
            { title: "Let the table scroll inside its own box on small screens", status: "pending" },
            { title: "Keep the desktop layout as it is", status: "pending" },
          ],
        },
      },
      { tool: "read_file", input: { path: "index.html" } },
      { tool: "read_file", input: { path: "styles.css" } },
    ],
  },
  {
    stop: "tool_use",
    blocks: [
      {
        text: "The table has `min-width: 720px`, so on a phone it's wider than the screen and pushes the whole page sideways. I'll give it its own scrolling container, so only the table scrolls and the rest of the page stays put.",
      },
      {
        tool: "update_plan",
        input: {
          steps: [
            { title: "Find why the table overflows", status: "done" },
            { title: "Let the table scroll inside its own box on small screens", status: "in_progress" },
            { title: "Keep the desktop layout as it is", status: "pending" },
          ],
        },
      },
      {
        tool: "edit_file",
        input: {
          path: "index.html",
          old_text: '        <table class="plans">',
          new_text: '        <div class="plans-scroll" role="region" aria-label="Plans" tabindex="0">\n        <table class="plans">',
        },
      },
      {
        tool: "edit_file",
        input: { path: "index.html", old_text: "        </table>", new_text: "        </table>\n        </div>" },
      },
      {
        tool: "edit_file",
        input: {
          path: "styles.css",
          old_text: ".plans {\n  width: 100%;\n  min-width: 720px;",
          new_text: ".plans-scroll {\n  overflow-x: auto;\n}\n\n.plans {\n  width: 100%;\n  min-width: 560px;",
        },
      },
    ],
  },
  {
    stop: "tool_use",
    blocks: [
      { thinking: "The scroll box is focusable so keyboard users can scroll it; it needs a visible focus style." },
      {
        tool: "edit_file",
        input: {
          path: "styles.css",
          old_text: ".plans-scroll {\n  overflow-x: auto;\n}",
          new_text: ".plans-scroll {\n  overflow-x: auto;\n}\n\n.plans-scroll:focus-visible {\n  outline: 2px solid #3355cc;\n  outline-offset: 4px;\n}",
        },
      },
      {
        tool: "update_plan",
        input: {
          steps: [
            { title: "Find why the table overflows", status: "done" },
            { title: "Let the table scroll inside its own box on small screens", status: "done" },
            { title: "Keep the desktop layout as it is", status: "done" },
          ],
        },
      },
    ],
  },
  {
    stop: "end_turn",
    blocks: [
      {
        text: "The pricing table now scrolls inside its own container on narrow screens instead of pushing the page sideways, and its minimum width dropped from 720px to 560px so it needs less scrolling. On desktop it looks the same. The scroll container is labelled and focusable, so keyboard users can scroll it too.",
      },
    ],
  },
];

export const REPLAYS: Record<string, ScriptedTurn[]> = {
  "broken-link": brokenLink,
  "pricing-mobile": pricingMobile,
};
