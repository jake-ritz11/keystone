/**
 * The component reference: what each one is for, its props and its keyboard model. Hand-written
 * so the descriptions can say why, not just what; `api.test.ts` fails if a table drifts from the
 * interface it documents. The docs site renders it, and the MCP server hands it to Claude. It
 * isn't part of the published package.
 */

export interface ComponentSummary {
  /** URL segment on the docs site, and the key into `api`. */
  slug: string;
  /** The component's name in the docs. */
  name: string;
  /** What to import from "@keystone-ui/ui" to use it. */
  imports: string[];
  summary: string;
}

/** Every component, in docs order. */
export const COMPONENTS: ComponentSummary[] = [
  { slug: "button", name: "Button", imports: ["Button"], summary: "Actions, in four variants, with a loading state that keeps focus." },
  { slug: "input", name: "Input", imports: ["Input"], summary: "A labelled text field with hint and error text wired for screen readers." },
  { slug: "textarea", name: "Textarea", imports: ["Textarea"], summary: "Multi-line text that grows as you type, up to a limit, then scrolls." },
  { slug: "select", name: "Select", imports: ["Select"], summary: "A native select, with a token-styled popup where the browser allows it." },
  { slug: "dialog", name: "Dialog", imports: ["Dialog"], summary: "A modal on the native <dialog>, with React in control of open state." },
  { slug: "menu", name: "Menu", imports: ["Menu", "MenuItem", "MenuSeparator"], summary: "An actions menu on the popover API, with the full menu keyboard model." },
  { slug: "tabs", name: "Tabs", imports: ["Tabs", "TabList", "Tab", "TabPanel"], summary: "Underline or segmented, horizontal or vertical, automatic or manual." },
  { slug: "segmented-control", name: "SegmentedControl", imports: ["SegmentedControl"], summary: "One choice from a few, side by side, as a keyboard-friendly radio group." },
  { slug: "tooltip", name: "Tooltip", imports: ["Tooltip"], summary: "Hover and focus hints that follow WCAG's rules for content on hover." },
  { slug: "disclosure", name: "Disclosure", imports: ["Disclosure"], summary: "Show and hide a section, on the native details element." },
  { slug: "badge", name: "Badge", imports: ["Badge"], summary: "A short, static label for a status or a category." },
  { slug: "diff-view", name: "DiffView", imports: ["DiffView"], summary: "A unified diff for reviewing a change, readable by screen readers." },
  { slug: "toast", name: "Toast", imports: ["ToastProvider", "useToast"], summary: "Announced notifications that pause on hover and work over a modal." },
];

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export interface PropsPart {
  /** The interface documented, e.g. "DialogProps". */
  interface: string;
  /** Repo path of the file that declares it. */
  source: string;
  /** What else it accepts, e.g. "every <dialog> attribute". */
  extends?: string;
  /** A sentence on how it's used, when the props alone don't say. */
  note?: string;
  props: PropDoc[];
}

export interface KeyDoc {
  keys: string;
  action: string;
}

export interface ComponentApi {
  parts: PropsPart[];
  keyboard?: KeyDoc[];
}

const FIELD: PropsPart = {
  interface: "FieldOwnProps",
  source: "packages/ui/src/field/Field.tsx",
  props: [
    { name: "label", type: "ReactNode", required: true, description: "The visible label. Always required, so the field is always named." },
    { name: "hideLabel", type: "boolean", default: "false", description: "Hides the label visually but keeps it for assistive tech." },
    { name: "hint", type: "ReactNode", description: "Help text below the control, linked with aria-describedby." },
    { name: "error", type: "ReactNode", description: "Error text. Sets aria-invalid and is read out with the field." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Control height and text size." },
    {
      name: "reserveMessageSpace",
      type: "boolean",
      default: "true",
      description: "Keeps a line for the hint or error, so an error appearing later doesn't push the page down. Turn off for fields that never show one.",
    },
  ],
};

export const api: Record<string, ComponentApi> = {
  button: {
    parts: [
      {
        interface: "ButtonProps",
        source: "packages/ui/src/button/Button.tsx",
        extends: "every <button> attribute; type defaults to \"button\"",
        props: [
          { name: "variant", type: '"primary" | "secondary" | "ghost" | "danger"', default: '"primary"', description: "Visual weight. Keep one primary action per view." },
          { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Padding and text size." },
          { name: "loading", type: "boolean", default: "false", description: "Shows a spinner over the label and sets aria-busy. The width doesn't change, clicks are ignored, and the button keeps focus." },
          { name: "iconStart", type: "ReactNode", description: "Icon before the label. Hidden while loading." },
          { name: "iconEnd", type: "ReactNode", description: "Icon after the label." },
        ],
      },
    ],
    keyboard: [
      { keys: "Enter, Space", action: "Activates the button (native)." },
    ],
  },
  input: {
    parts: [
      {
        interface: "InputProps",
        source: "packages/ui/src/input/Input.tsx",
        extends: "FieldOwnProps and every <input> attribute; className goes on the wrapper, everything else and the ref on the <input>",
        props: [
          { name: "iconStart", type: "ReactNode", description: "Decorative icon before the text. Hidden from assistive tech." },
          { name: "iconEnd", type: "ReactNode", description: "Decorative icon after the text." },
        ],
      },
      FIELD,
    ],
  },
  textarea: {
    parts: [
      {
        interface: "TextareaProps",
        source: "packages/ui/src/textarea/Textarea.tsx",
        extends: "FieldOwnProps and every <textarea> attribute; className goes on the wrapper, everything else and the ref on the <textarea>",
        props: [
          { name: "autoResize", type: "boolean", default: "true", description: "Grow with the text, from minRows to maxRows, then scroll." },
          { name: "minRows", type: "number", default: "3", description: "Height when empty, in lines." },
          { name: "maxRows", type: "number", default: "12", description: "Tallest it grows before scrolling, in lines." },
        ],
      },
      FIELD,
    ],
  },
  disclosure: {
    parts: [
      {
        interface: "DisclosureProps",
        source: "packages/ui/src/disclosure/Disclosure.tsx",
        extends: "every <details> attribute, including name for exclusive groups",
        props: [
          { name: "summary", type: "ReactNode", required: true, description: "The always-visible line that opens and closes it." },
          { name: "meta", type: "ReactNode", description: "Shown at the end of the summary, e.g. a Badge; read as part of it." },
          { name: "open", type: "boolean", description: "Whether it's open, when controlled." },
          { name: "defaultOpen", type: "boolean", default: "false", description: "Whether it starts open, when uncontrolled." },
          { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the user opens or closes it." },
          { name: "variant", type: '"bordered" | "plain"', default: '"bordered"', description: "A bordered box, or a plain line for lists like FAQs." },
        ],
      },
    ],
    keyboard: [
      { keys: "Tab", action: "To the summary." },
      { keys: "Enter, Space", action: "Opens or closes it (native)." },
    ],
  },
  badge: {
    parts: [
      {
        interface: "BadgeProps",
        source: "packages/ui/src/badge/Badge.tsx",
        extends: "every <span> attribute",
        props: [
          { name: "tone", type: '"neutral" | "accent" | "success" | "danger"', default: '"neutral"', description: "Color. The text still has to carry the meaning." },
          { name: "dot", type: "boolean", default: "false", description: "A leading dot, for statuses." },
        ],
      },
    ],
  },
  "diff-view": {
    parts: [
      {
        interface: "DiffViewProps",
        source: "packages/ui/src/diff-view/DiffView.tsx",
        extends: "every <section> attribute. Hunks match agent-core's diffHunks() output",
        props: [
          { name: "path", type: "string", required: true, description: "The file the change is to. Also names the section." },
          { name: "hunks", type: "DiffViewHunk[]", required: true, description: "Changed regions, each with its lines and their numbers on both sides." },
          { name: "actions", type: "ReactNode", description: "Header content after the path and counts, such as Approve and Reject." },
        ],
      },
    ],
  },
  select: {
    parts: [
      {
        interface: "SelectProps",
        source: "packages/ui/src/select/Select.tsx",
        extends: "FieldOwnProps and every <select> attribute except multiple; children are <option> and <optgroup>",
        props: [
          { name: "placeholder", type: "string", description: "An empty first option shown as a prompt. With required, the user has to pick a real one." },
        ],
      },
      FIELD,
    ],
    keyboard: [
      { keys: "Space, Enter, Alt+Down", action: "Opens the list (native)." },
      { keys: "Up, Down", action: "Moves through options (native)." },
      { keys: "Type a letter", action: "Jumps to a matching option (native)." },
      { keys: "Escape", action: "Closes without changing the value (native)." },
    ],
  },
  dialog: {
    parts: [
      {
        interface: "DialogProps",
        source: "packages/ui/src/dialog/Dialog.tsx",
        extends: "every <dialog> attribute except open and title",
        props: [
          { name: "open", type: "boolean", required: true, description: "Whether the dialog is open. Drives showModal() and close()." },
          { name: "onOpenChange", type: "(open: boolean) => void", required: true, description: "Called with false on Escape, the close button, or a backdrop click." },
          { name: "title", type: "ReactNode", required: true, description: "The heading, and the dialog's accessible name." },
          { name: "description", type: "ReactNode", description: "Supporting text, linked with aria-describedby." },
          { name: "footer", type: "ReactNode", description: "Usually the actions. Stays in place while the body scrolls." },
          { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Width: 400, 520 or 720px, never wider than the viewport." },
          { name: "dismissible", type: "boolean", default: "true", description: "Whether a backdrop click closes it. Turn off when it holds unsaved input." },
          { name: "hideCloseButton", type: "boolean", default: "false", description: "Hides the corner close button, e.g. when the footer has Cancel." },
        ],
      },
    ],
    keyboard: [
      { keys: "Tab, Shift+Tab", action: "Moves focus within the dialog; the page behind is inert (native)." },
      { keys: "Escape", action: "Asks to close, through onOpenChange(false)." },
    ],
  },
  menu: {
    parts: [
      {
        interface: "MenuProps",
        source: "packages/ui/src/menu/Menu.tsx",
        extends: "every <div> attribute, applied to the menu",
        props: [
          { name: "trigger", type: "ReactNode", required: true, description: "One button. It can come from a server component." },
          { name: "children", type: "ReactNode", required: true, description: "MenuItem and MenuSeparator elements." },
          { name: "align", type: '"start" | "end"', default: '"start"', description: "Which edge of the trigger the menu lines up with." },
        ],
      },
      {
        interface: "MenuItemProps",
        source: "packages/ui/src/menu/Menu.tsx",
        extends: "every <button> attribute; the menu closes after onClick unless it calls preventDefault()",
        props: [
          { name: "iconStart", type: "ReactNode", description: "Icon before the label." },
          { name: "shortcut", type: "string", description: "A shortcut hint for display only. Wire the shortcut itself separately." },
          { name: "tone", type: '"default" | "danger"', default: '"default"', description: "Danger for destructive actions." },
        ],
      },
    ],
    keyboard: [
      { keys: "Enter, Space", action: "On the trigger: opens the menu on the first item." },
      { keys: "Down", action: "On the trigger: opens on the first item. In the menu: next item, wrapping." },
      { keys: "Up", action: "On the trigger: opens on the last item. In the menu: previous item, wrapping." },
      { keys: "Home, End", action: "First or last item." },
      { keys: "Type a letter", action: "Next item starting with that letter." },
      { keys: "Enter, Space", action: "On an item: runs it, closes the menu, returns focus to the trigger." },
      { keys: "Escape", action: "Closes and returns focus to the trigger." },
      { keys: "Tab", action: "Closes the menu." },
    ],
  },
  tabs: {
    parts: [
      {
        interface: "TabsProps",
        source: "packages/ui/src/tabs/Tabs.tsx",
        extends: "every <div> attribute except defaultValue and onChange",
        props: [
          { name: "value", type: "string", description: "The selected tab, when controlled." },
          { name: "defaultValue", type: "string", description: "The first selected tab, when uncontrolled." },
          { name: "onValueChange", type: "(value: string) => void", description: "Called when the selection changes." },
          { name: "activation", type: '"automatic" | "manual"', default: '"automatic"', description: "Automatic selects on focus. Manual waits for Enter or Space, for panels that load something." },
          { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Which arrow keys move between tabs." },
          { name: "variant", type: '"underline" | "segmented"', default: '"underline"', description: "Visual style." },
        ],
      },
      {
        interface: "TabListProps",
        source: "packages/ui/src/tabs/Tabs.tsx",
        extends: "every <div> attribute",
        props: [{ name: "aria-label", type: "string", description: "Names the tab list when a page has more than one." }],
      },
      {
        interface: "TabProps",
        source: "packages/ui/src/tabs/Tabs.tsx",
        extends: "every <button> attribute",
        props: [{ name: "value", type: "string", required: true, description: "Matches the TabPanel it controls." }],
      },
      {
        interface: "TabPanelProps",
        source: "packages/ui/src/tabs/Tabs.tsx",
        extends: "every <div> attribute",
        props: [{ name: "value", type: "string", required: true, description: "Matches its Tab." }],
      },
    ],
    keyboard: [
      { keys: "Tab", action: "Into the tab list (on the selected tab), then on to its panel." },
      { keys: "Left, Right", action: "Previous or next tab, wrapping and skipping disabled ones. Up and Down when vertical." },
      { keys: "Home, End", action: "First or last tab." },
      { keys: "Enter, Space", action: "Selects the focused tab (manual activation)." },
    ],
  },
  "segmented-control": {
    parts: [
      {
        interface: "SegmentedControlProps",
        source: "packages/ui/src/segmented-control/SegmentedControl.tsx",
        extends: "every <div> attribute except onChange and defaultValue",
        props: [
          { name: "aria-label", type: "string", required: true, description: "Names the group, e.g. \"Preview width\"." },
          { name: "options", type: "{ value, label, disabled? }[]", required: true, description: "The choices, in order." },
          { name: "value", type: "string", description: "The selected value, when controlled." },
          { name: "defaultValue", type: "string", default: "the first enabled option", description: "The first selected value, when uncontrolled." },
          { name: "onValueChange", type: "(value) => void", description: "Called when the selection changes." },
          { name: "size", type: '"sm" | "md"', default: '"md"', description: "Padding and text size." },
        ],
      },
    ],
    keyboard: [
      { keys: "Tab", action: "Into the group, on the selected option; Tab again leaves it." },
      { keys: "Right, Down", action: "Next option, selected at once; wraps and skips disabled ones. Mirrored in right-to-left text." },
      { keys: "Left, Up", action: "Previous option." },
      { keys: "Home, End", action: "First or last option." },
    ],
  },
  tooltip: {
    parts: [
      {
        interface: "TooltipProps",
        source: "packages/ui/src/tooltip/Tooltip.tsx",
        props: [
          { name: "content", type: "ReactNode", required: true, description: "The text. Never put anything interactive in a tooltip." },
          { name: "children", type: "ReactNode", required: true, description: "One focusable element. It can come from a server component." },
          { name: "side", type: '"top" | "bottom"', default: '"top"', description: "Preferred side. It flips when there's no room." },
          { name: "kind", type: '"description" | "label"', default: '"description"', description: "label for icon-only buttons, where the tooltip is the name." },
          { name: "delay", type: "number", default: "500", description: "Hover delay in ms. Keyboard focus shows it at once." },
        ],
      },
    ],
    keyboard: [
      { keys: "Tab", action: "Focusing the trigger shows the tooltip at once." },
      { keys: "Escape", action: "Hides it without moving focus." },
    ],
  },
  toast: {
    parts: [
      {
        interface: "ToastProviderProps",
        source: "packages/ui/src/toast/Toast.tsx",
        props: [
          { name: "children", type: "ReactNode", required: true, description: "Your app. Wrap it once, near the root." },
          { name: "duration", type: "number", default: "5000", description: "Default time on screen in ms." },
        ],
      },
      {
        interface: "ToastOptions",
        source: "packages/ui/src/toast/Toast.tsx",
        note: "Passed to toast() from useToast(), which returns the toast's id for dismiss().",
        props: [
          { name: "title", type: "string", required: true, description: "The message." },
          { name: "description", type: "string", description: "One more sentence of detail." },
          { name: "tone", type: '"neutral" | "success" | "danger"', default: '"neutral"', description: "Danger is announced assertively, the others politely." },
          { name: "action", type: "{ label: string; onClick: () => void }", description: "One action, like Undo. It must also be reachable elsewhere, since toasts time out." },
          { name: "duration", type: "number", default: "the provider's", description: "Time on screen in ms. Infinity keeps it until closed." },
        ],
      },
    ],
  },
};
