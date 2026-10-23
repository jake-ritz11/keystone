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

const DARK_STEPS = ["Find every hard-coded color", "Move the colors into custom properties", "Add dark values for the system setting", "Check nothing is left hard-coded"];
const darkPlan = (done: number) => ({
  tool: "update_plan",
  input: { steps: DARK_STEPS.map((title, i) => ({ title, status: i < done ? "done" : i === done ? "in_progress" : "pending" })) },
});

const darkMode: ScriptedTurn[] = [
  {
    stop: "tool_use",
    blocks: [{ thinking: "Colors are set directly in styles.css; a dark mode needs them in one place first." }, darkPlan(0), { tool: "read_file", input: { path: "styles.css" } }],
  },
  {
    stop: "tool_use",
    blocks: [
      {
        text: "There are seven hard-coded colors spread across the stylesheet. I'll define them once as custom properties, with dark values under `prefers-color-scheme: dark`, then point every rule at them.",
      },
      darkPlan(1),
      {
        tool: "edit_file",
        input: {
          path: "styles.css",
          old_text: "* {\n  box-sizing: border-box;\n}\n",
          new_text:
            ":root {\n  color-scheme: light dark;\n  --bg: #ffffff;\n  --text: #1f2328;\n  --muted: #59636e;\n  --link: #3355cc;\n  --line: #e5e5e5;\n  --on-link: #ffffff;\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    --bg: #16181d;\n    --text: #e6e8eb;\n    --muted: #9aa3ad;\n    --link: #8ea8ff;\n    --line: #2c313a;\n    --on-link: #10131a;\n  }\n}\n\n* {\n  box-sizing: border-box;\n}\n",
        },
      },
    ],
  },
  {
    stop: "tool_use",
    blocks: [
      { thinking: "Now each rule reads the variables instead of a literal." },
      darkPlan(2),
      { tool: "edit_file", input: { path: "styles.css", old_text: "  background: #ffffff;\n  color: #1f2328;", new_text: "  background: var(--bg);\n  color: var(--text);" } },
      { tool: "edit_file", input: { path: "styles.css", old_text: "a {\n  color: #3355cc;\n}", new_text: "a {\n  color: var(--link);\n}" } },
      {
        tool: "edit_file",
        input: { path: "styles.css", old_text: "  padding: 16px 32px;\n  border-bottom: 1px solid #e5e5e5;", new_text: "  padding: 16px 32px;\n  border-bottom: 1px solid var(--line);" },
      },
      { tool: "edit_file", input: { path: "styles.css", old_text: "  text-decoration: none;\n  color: #1f2328;", new_text: "  text-decoration: none;\n  color: var(--text);" } },
      { tool: "edit_file", input: { path: "styles.css", old_text: "  color: #b0b0b0;", new_text: "  color: var(--muted);" } },
      { tool: "edit_file", input: { path: "styles.css", old_text: "  background: #3355cc;\n  color: #ffffff;", new_text: "  background: var(--link);\n  color: var(--on-link);" } },
      {
        tool: "edit_file",
        input: { path: "styles.css", old_text: "  padding: 12px 16px;\n  border-bottom: 1px solid #e5e5e5;", new_text: "  padding: 12px 16px;\n  border-bottom: 1px solid var(--line);" },
      },
      {
        tool: "edit_file",
        input: { path: "styles.css", old_text: "  border-top: 1px solid #e5e5e5;\n  color: #aaaaaa;", new_text: "  border-top: 1px solid var(--line);\n  color: var(--muted);" },
      },
    ],
  },
  {
    stop: "tool_use",
    blocks: [{ thinking: "Checking no literal colors are left outside the variable blocks." }, darkPlan(3), { tool: "search", input: { query: "#[0-9a-f]{6}", regex: true, path: "styles.css" } }],
  },
  {
    stop: "tool_use",
    blocks: [darkPlan(4)],
  },
  {
    stop: "end_turn",
    blocks: [
      {
        text: "The site now follows the visitor's system setting. Every color lives in one set of custom properties with light and dark values, and `color-scheme` tells the browser to match its own controls and scrollbars. Text keeps readable contrast in both: body text is 14:1 on the dark background, muted text 7:1. The nav and footer grey also got darker in light mode, which fixes their low contrast.",
      },
    ],
  },
];

const A11Y_STEPS = ["Check the home page's markup and colors", "Give the hero image a text alternative", "Label the pricing table's headers", "Fix the low-contrast text"];
const a11yPlan = (done: number) => ({
  tool: "update_plan",
  input: { steps: A11Y_STEPS.map((title, i) => ({ title, status: i < done ? "done" : i === done ? "in_progress" : "pending" })) },
});

const accessibility: ScriptedTurn[] = [
  {
    stop: "tool_use",
    blocks: [a11yPlan(0), { tool: "read_file", input: { path: "index.html" } }, { tool: "read_file", input: { path: "styles.css" } }],
  },
  {
    stop: "tool_use",
    blocks: [
      {
        text: "I found four problems: the hero image has no `alt` text, the pricing table's corner header is empty and its row labels aren't headers, and the nav and footer text are too pale to read comfortably (2.2:1 and 2.3:1 against white, where 4.5:1 is the minimum).",
      },
      a11yPlan(1),
      {
        tool: "edit_file",
        input: {
          path: "index.html",
          old_text: '<img src="screenshot.png" class="hero-image" />',
          new_text: '<img src="screenshot.png" class="hero-image" alt="The Margin app, with a list of notes beside an open note" />',
        },
      },
    ],
  },
  {
    stop: "tool_use",
    blocks: [
      { thinking: "Row labels as row headers, so each price is read with its plan and its feature." },
      a11yPlan(2),
      { tool: "edit_file", input: { path: "index.html", old_text: "<th></th>", new_text: '<th scope="col">Feature</th>' } },
      { tool: "edit_file", input: { path: "index.html", old_text: "<td>Price</td>", new_text: '<th scope="row">Price</th>' } },
      { tool: "edit_file", input: { path: "index.html", old_text: "<td>Devices</td>", new_text: '<th scope="row">Devices</th>' } },
      { tool: "edit_file", input: { path: "index.html", old_text: "<td>Version history</td>", new_text: '<th scope="row">Version history</th>' } },
      { tool: "edit_file", input: { path: "index.html", old_text: "<td>Shared notebooks</td>", new_text: '<th scope="row">Shared notebooks</th>' } },
    ],
  },
  {
    stop: "tool_use",
    blocks: [
      { thinking: "#59636e on white is 6.1:1, comfortably over the minimum, and still reads as secondary." },
      a11yPlan(3),
      { tool: "edit_file", input: { path: "styles.css", old_text: "  color: #b0b0b0;", new_text: "  color: #59636e;" } },
      { tool: "edit_file", input: { path: "styles.css", old_text: "  color: #aaaaaa;", new_text: "  color: #59636e;" } },
      a11yPlan(4),
    ],
  },
  {
    stop: "end_turn",
    blocks: [
      {
        text: "Fixed four problems on the home page. The hero image now has a text alternative. The pricing table has a named corner header, and its row labels are row headers, so each price is read with its feature. The nav and footer text went from about 2.2:1 contrast to 6.1:1. The broken About link is a separate task, so I left it.",
      },
    ],
  },
];

export const REPLAYS: Record<string, ScriptedTurn[]> = {
  "broken-link": brokenLink,
  "pricing-mobile": pricingMobile,
  "dark-mode": darkMode,
  accessibility,
};
