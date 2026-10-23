/**
 * The sandbox the agent works on: a small landing site for a fictional notes app, with a few
 * problems planted for the tasks to find. Kept small enough to read in full, and real enough
 * that the edits look like real work.
 */
import type { Workspace } from "../workspace.ts";

const INDEX = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Margin: notes that stay out of the way</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="logo" href="index.html">Margin</a>
      <nav>
        <a href="index.html">Home</a>
        <a href="abuot.html">About</a>
        <a href="#pricing">Pricing</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <h1>Notes that stay out of the way</h1>
        <p>Margin keeps your notes plain, fast and searchable, on every device you own.</p>
        <a class="button" href="#pricing">See plans</a>
        <img src="screenshot.png" class="hero-image" />
      </section>

      <section class="features">
        <div class="feature">
          <h2>Plain text first</h2>
          <p>Your notes are files you own. Export everything, any time, in one click.</p>
        </div>
        <div class="feature">
          <h2>Instant search</h2>
          <p>Find any note by a word you half remember, in under a tenth of a second.</p>
        </div>
        <div class="feature">
          <h2>Quietly synced</h2>
          <p>Edits sync in the background, end to end encrypted, with full history.</p>
        </div>
      </section>

      <section id="pricing" class="pricing">
        <h2>Pricing</h2>
        <table class="plans">
          <thead>
            <tr>
              <th></th>
              <th>Free</th>
              <th>Personal</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              <td>$0</td>
              <td>$4 / month</td>
              <td>$8 / person / month</td>
            </tr>
            <tr>
              <td>Devices</td>
              <td>2</td>
              <td>Unlimited</td>
              <td>Unlimited</td>
            </tr>
            <tr>
              <td>Version history</td>
              <td>7 days</td>
              <td>1 year</td>
              <td>Forever</td>
            </tr>
            <tr>
              <td>Shared notebooks</td>
              <td>No</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <footer class="site-footer">
      <p>Made by a small team. Questions? <a href="mailto:hello@example.com">hello@example.com</a></p>
    </footer>
  </body>
</html>
`;

const ABOUT = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>About Margin</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="logo" href="index.html">Margin</a>
      <nav>
        <a href="index.html">Home</a>
        <a href="about.html">About</a>
        <a href="index.html#pricing">Pricing</a>
      </nav>
    </header>

    <main class="page">
      <h1>About</h1>
      <p>Margin started as a weekend project: a notes app that opens instantly and never asks for anything.</p>
      <p>We're three people. We don't sell data, and we don't plan to.</p>
    </main>

    <footer class="site-footer">
      <p>Made by a small team. Questions? <a href="mailto:hello@example.com">hello@example.com</a></p>
    </footer>
  </body>
</html>
`;

const STYLES = `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #ffffff;
  color: #1f2328;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}

a {
  color: #3355cc;
}

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  border-bottom: 1px solid #e5e5e5;
}

.logo {
  font-weight: 700;
  text-decoration: none;
  color: #1f2328;
}

nav a {
  margin-left: 24px;
  color: #b0b0b0;
  text-decoration: none;
}

.hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 64px 32px;
  text-align: center;
}

.hero h1 {
  font-size: 48px;
  line-height: 1.1;
}

.hero-image {
  width: 100%;
  margin-top: 32px;
  border-radius: 12px;
}

.button {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  background: #3355cc;
  color: #ffffff;
  text-decoration: none;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  max-width: 960px;
  margin: 0 auto;
  padding: 32px;
}

.feature h2 {
  font-size: 20px;
}

.pricing {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px;
}

.plans {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

.plans th,
.plans td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  text-align: left;
}

.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 32px;
}

.site-footer {
  padding: 32px;
  border-top: 1px solid #e5e5e5;
  color: #aaaaaa;
  text-align: center;
}
`;

const README = `# Margin website

The marketing site for Margin. Plain HTML and CSS, no build step: open \`index.html\` in a
browser.

- \`index.html\`: home page, with features and pricing
- \`about.html\`: about page
- \`styles.css\`: all styles, shared by both pages
`;

export const SAMPLE_SITE: Workspace = {
  "README.md": README,
  "about.html": ABOUT,
  "index.html": INDEX,
  "styles.css": STYLES,
};

export interface SampleTask {
  id: string;
  title: string;
  prompt: string;
  /** For the study write-up: what a good outcome looks like. Never shown to the agent. */
  rubric: string[];
}

export const SAMPLE_TASKS: SampleTask[] = [
  {
    id: "pricing-mobile",
    title: "Fix the pricing table on phones",
    prompt: "The pricing table is unreadable on phones: it runs off the side of the screen. Make it work on small screens without changing how it looks on desktop.",
    rubric: [
      "The table no longer forces a 720px minimum width",
      "On narrow screens the table scrolls inside its own container or reflows",
      "Desktop layout is unchanged",
    ],
  },
  {
    id: "broken-link",
    title: "Fix the broken link",
    prompt: "Someone reported that a link on the home page goes nowhere. Find it and fix it.",
    rubric: ["The About link points to about.html", "No other links were changed"],
  },
  {
    id: "dark-mode",
    title: "Add a dark mode",
    prompt: "Add a dark mode that follows the visitor's system setting.",
    rubric: [
      "Colors move to CSS custom properties",
      "A prefers-color-scheme: dark block redefines them",
      "Text keeps readable contrast in both modes",
    ],
  },
  {
    id: "accessibility",
    title: "Fix accessibility problems",
    prompt: "Check the home page for accessibility problems and fix what you find.",
    rubric: [
      "The hero image gets alt text",
      "The nav and footer text colors get enough contrast",
      "The empty table header cell is handled",
    ],
  },
];
