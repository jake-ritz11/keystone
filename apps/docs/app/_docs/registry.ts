/**
 * Every page in the docs, in sidebar order. The sidebar and search are client components, so this
 * imports the component list on its own, without the props tables (those stay on the server).
 */
import { CATEGORIES, COMPONENTS, type ComponentCategory } from "@keystone-ui/ui/docs/components";

export interface DocLink {
  href: string;
  title: string;
  summary: string;
}

export const foundations: DocLink[] = [
  { href: "/tokens", title: "Tokens", summary: "Color, space, radius, type and motion, as CSS variables." },
  { href: "/motion", title: "Motion", summary: "What moves, why, how fast, and what reduced motion turns it into." },
];

export const components: DocLink[] = COMPONENTS.map((c) => ({ href: `/components/${c.slug}`, title: c.name, summary: c.summary }));

/** The components in the sidebar's groups, in category order and docs order within each. */
export const componentGroups: { category: ComponentCategory; links: DocLink[] }[] = CATEGORIES.map((category) => ({
  category,
  links: COMPONENTS.filter((c) => c.category === category).map((c) => ({
    href: `/components/${c.slug}`,
    title: c.name,
    summary: c.summary,
  })),
}));

export const REPO = "https://github.com/jake-ritz11/keystone";

export interface Writing {
  slug: string;
  file: string;
  title: string;
  summary: string;
}

/** The write-ups in docs/, rendered as pages under /writing. */
export const WRITING: Writing[] = [
  { slug: "case-study", file: "case-study.md", title: "Case study", summary: "The agent interface from question to tests: what was built, what broke, and what isn't proven." },
  { slug: "comparison", file: "comparison.md", title: "How Keystone compares", summary: "Against five component libraries, six design systems and three agent UI kits: what it adopted, what it skips, and the bugs the comparison found." },
  { slug: "content-guidelines", file: "content-guidelines.md", title: "Content guidelines", summary: "How the interfaces talk: actions, tool states, errors and forms, with the rules a test enforces." },
  { slug: "evals", file: "evals.md", title: "Does the MCP server help?", summary: "An eval of the same UI tasks with and without the MCP tools, scored by the audit and the component reference." },
  { slug: "streaming", file: "streaming.md", title: "Streaming and screen readers", summary: "What a screen reader should say while a response streams in: the sources, the design, and what NVDA was measured saying." },
  { slug: "voice", file: "voice.md", title: "Voice", summary: "How the long-form writing reads, modelled on six student theses and checked against the known signs of machine-written text." },
  { slug: "mobile", file: "mobile.md", title: "Mobile", summary: "The small-screen standards, from WCAG and the platform guidelines, with the data behind them and the tests that hold them." },
  { slug: "decisions", file: "decisions.md", title: "Decisions", summary: "Why it's built this way, what broke, and what the tests do and don't prove." },
  { slug: "variants", file: "variants.md", title: "Interaction variants", summary: "The three open questions the study compares, with expectations written before testing." },
  { slug: "study-plan", file: "study-plan.md", title: "Study plan", summary: "The protocol, measures, data dictionary and analysis, set before any sessions run." },
  { slug: "phase-2-plan", file: "phase-2-plan.md", title: "Phase 2 plan", summary: "The agent interface's architecture, tools, variants and milestones." },
  { slug: "screen-reader-checklist", file: "screen-reader-checklist.md", title: "Screen-reader checklist", summary: "The scripted NVDA pass, check by check." },
];

export const writing: DocLink[] = [
  { href: "/writing", title: "Overview", summary: "All the write-ups." },
  ...WRITING.map((w) => ({ href: `/writing/${w.slug}`, title: w.title, summary: w.summary })),
];
