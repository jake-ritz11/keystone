/** Every page in the docs, in sidebar order. */

export interface DocLink {
  href: string;
  title: string;
  summary: string;
}

export const foundations: DocLink[] = [
  { href: "/tokens", title: "Tokens", summary: "Color, space, radius, type and motion, as CSS variables." },
];

export const components: DocLink[] = [
  { href: "/components/button", title: "Button", summary: "Actions, in four variants, with a loading state that keeps focus." },
  { href: "/components/input", title: "Input", summary: "A labelled text field with hint and error text wired for screen readers." },
  { href: "/components/textarea", title: "Textarea", summary: "Multi-line text that grows as you type, up to a limit, then scrolls." },
  { href: "/components/select", title: "Select", summary: "A native select, with a token-styled popup where the browser allows it." },
  { href: "/components/dialog", title: "Dialog", summary: "A modal on the native <dialog>, with React in control of open state." },
  { href: "/components/menu", title: "Menu", summary: "An actions menu on the popover API, with the full menu keyboard model." },
  { href: "/components/tabs", title: "Tabs", summary: "Underline or segmented, horizontal or vertical, automatic or manual." },
  { href: "/components/segmented-control", title: "SegmentedControl", summary: "One choice from a few, side by side, as a keyboard-friendly radio group." },
  { href: "/components/tooltip", title: "Tooltip", summary: "Hover and focus hints that follow WCAG's rules for content on hover." },
  { href: "/components/disclosure", title: "Disclosure", summary: "Show and hide a section, on the native details element." },
  { href: "/components/badge", title: "Badge", summary: "A short, static label for a status or a category." },
  { href: "/components/diff-view", title: "DiffView", summary: "A unified diff for reviewing a change, readable by screen readers." },
  { href: "/components/toast", title: "Toast", summary: "Announced notifications that pause on hover and work over a modal." },
];

export const REPO = "https://github.com/jake-ritz11/keystone";
