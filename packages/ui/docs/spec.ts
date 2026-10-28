/**
 * The hand-written half of the component reference: what each component is for, what its
 * props extend, and its keyboard model. The props themselves are read from the component
 * sources and their JSDoc (see props.ts), and `api.ts` puts the two together. It isn't part of
 * the published package.
 */

export interface ComponentSummary {
  /** URL segment on the docs site, and the key into `api`. */
  slug: string;
  /** The component's name in the docs. */
  name: string;
  /** What to import from "@keystone-ui/ui" to use it. */
  imports: string[];
  summary: string;
  /** Where it sits in the docs' sidebar and search. */
  category: ComponentCategory;
}

/** The sidebar's component groups, in order. */
export const CATEGORIES = ["Actions", "Forms", "Overlays", "Layout", "Display"] as const;
export type ComponentCategory = (typeof CATEGORIES)[number];

/** Every component, in docs order. */
export const COMPONENTS: ComponentSummary[] = [
  { slug: "button", name: "Button", imports: ["Button"], summary: "Actions, in four variants, with a loading state that keeps focus.", category: "Actions" },
  { slug: "input", name: "Input", imports: ["Input"], summary: "A labelled text field with hint and error text wired for screen readers.", category: "Forms" },
  { slug: "textarea", name: "Textarea", imports: ["Textarea"], summary: "Multi-line text that grows as you type, up to a limit, then scrolls.", category: "Forms" },
  { slug: "select", name: "Select", imports: ["Select"], summary: "A native select, with a token-styled popup where the browser allows it.", category: "Forms" },
  { slug: "dialog", name: "Dialog", imports: ["Dialog"], summary: "A modal on the native <dialog>, with React in control of open state.", category: "Overlays" },
  { slug: "menu", name: "Menu", imports: ["Menu", "MenuItem", "MenuSeparator"], summary: "An actions menu on the popover API, with the full menu keyboard model.", category: "Actions" },
  { slug: "tabs", name: "Tabs", imports: ["Tabs", "TabList", "Tab", "TabPanel"], summary: "Underline or segmented, horizontal or vertical, automatic or manual.", category: "Layout" },
  { slug: "checkbox", name: "Checkbox", imports: ["Checkbox"], summary: "A native checkbox with a drawn box, a mixed state and a check that draws in.", category: "Forms" },
  { slug: "switch", name: "Switch", imports: ["Switch"], summary: "An on/off setting that applies at once, announced as a switch.", category: "Forms" },
  { slug: "radio-group", name: "RadioGroup", imports: ["RadioGroup"], summary: "One answer from a short list: native radios in a fieldset.", category: "Forms" },
  { slug: "slider", name: "Slider", imports: ["Slider"], summary: "A number from a range, on a native range input, with a formatted value.", category: "Forms" },
  { slug: "progress", name: "Progress", imports: ["Progress"], summary: "How far along work is, or that it's happening, on the native progress element.", category: "Display" },
  { slug: "segmented-control", name: "SegmentedControl", imports: ["SegmentedControl"], summary: "One choice from a few, side by side, as a keyboard-friendly radio group.", category: "Forms" },
  { slug: "toggle-group", name: "ToggleGroup", imports: ["ToggleGroup"], summary: "Buttons that stay pressed, for formatting, filters and view options.", category: "Forms" },
  { slug: "command-menu", name: "CommandMenu", imports: ["CommandMenu"], summary: "Every action in one searchable list, behind a keyboard shortcut.", category: "Actions" },
  { slug: "popover", name: "Popover", imports: ["Popover"], summary: "Interactive content beside its trigger, as a non-modal dialog on the popover API.", category: "Overlays" },
  { slug: "tooltip", name: "Tooltip", imports: ["Tooltip"], summary: "Hover and focus hints that follow WCAG's rules for content on hover.", category: "Overlays" },
  { slug: "accordion", name: "Accordion", imports: ["Accordion", "AccordionItem"], summary: "Sections under real headings, one or several open, still found by find-in-page.", category: "Layout" },
  { slug: "disclosure", name: "Disclosure", imports: ["Disclosure"], summary: "Show and hide a section, on the native details element.", category: "Layout" },
  { slug: "badge", name: "Badge", imports: ["Badge"], summary: "A short, static label for a status or a category.", category: "Display" },
  { slug: "shimmer", name: "Shimmer", imports: ["Shimmer"], summary: "Live text: a light sweeps across it while the work it names is happening.", category: "Display" },
  { slug: "streaming-text", name: "StreamingText", imports: ["StreamingText"], summary: "A response that arrives as it's read, announced a sentence at a time.", category: "Display" },
  { slug: "diff-view", name: "DiffView", imports: ["DiffView"], summary: "A unified diff for reviewing a change, readable by screen readers.", category: "Display" },
  { slug: "toast", name: "Toast", imports: ["ToastProvider", "useToast"], summary: "Announced notifications that pause on hover and work over a modal.", category: "Overlays" },
];

export interface PartSpec {
  /** The interface documented, e.g. "DialogProps". Its props are read from the source. */
  interface: string;
  /** Repo path of the file that declares it. */
  source: string;
  /** What else it accepts, e.g. "every <dialog> attribute". */
  extends?: string;
  /** A sentence on how it's used, when the props alone don't say. */
  note?: string;
}

export interface KeyDoc {
  keys: string;
  action: string;
}

export interface ComponentSpec {
  parts: PartSpec[];
  keyboard?: KeyDoc[];
}

const FIELD: PartSpec = {
  interface: "FieldOwnProps",
  source: "packages/ui/src/field/Field.tsx",
};

export const spec: Record<string, ComponentSpec> = {
  button: {
    parts: [
      {
        interface: "ButtonProps",
        source: "packages/ui/src/button/Button.tsx",
        extends: "every <button> attribute; type defaults to \"button\"",
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
      },
      FIELD,
    ],
  },
  accordion: {
    parts: [
      {
        interface: "AccordionProps",
        source: "packages/ui/src/accordion/Accordion.tsx",
        extends: "every <div> attribute except defaultValue and onChange",
        note: "Values are always an array, with or without multiple.",
      },
      {
        interface: "AccordionItemProps",
        source: "packages/ui/src/accordion/Accordion.tsx",
        extends: "every <div> attribute except title",
      },
    ],
    keyboard: [
      { keys: "Tab", action: "To each heading's button in turn, then into an open section's content." },
      { keys: "Enter, Space", action: "Opens or closes the focused section." },
      { keys: "Down, Up", action: "Next or previous heading; wraps and skips disabled ones." },
      { keys: "Home, End", action: "First or last heading." },
    ],
  },
  disclosure: {
    parts: [
      {
        interface: "DisclosureProps",
        source: "packages/ui/src/disclosure/Disclosure.tsx",
        extends: "every <details> attribute, including name for exclusive groups",
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
      },
    ],
  },
  shimmer: {
    parts: [
      {
        interface: "ShimmerProps",
        source: "packages/ui/src/shimmer/Shimmer.tsx",
        extends: "every <span> attribute",
      },
    ],
  },
  "streaming-text": {
    parts: [
      {
        interface: "StreamingTextProps",
        source: "packages/ui/src/streaming-text/StreamingText.tsx",
        extends: "every <div> attribute",
      },
    ],
  },
  "diff-view": {
    parts: [
      {
        interface: "DiffViewProps",
        source: "packages/ui/src/diff-view/DiffView.tsx",
        extends: "every <section> attribute. Hunks match agent-core's diffHunks() output",
      },
    ],
  },
  select: {
    parts: [
      {
        interface: "SelectProps",
        source: "packages/ui/src/select/Select.tsx",
        extends: "FieldOwnProps and every <select> attribute except multiple; children are <option> and <optgroup>",
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
      },
      {
        interface: "MenuItemProps",
        source: "packages/ui/src/menu/Menu.tsx",
        extends: "every <button> attribute; the menu closes after onClick unless it calls preventDefault()",
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
      },
      {
        interface: "TabListProps",
        source: "packages/ui/src/tabs/Tabs.tsx",
        extends: "every <div> attribute",
      },
      {
        interface: "TabProps",
        source: "packages/ui/src/tabs/Tabs.tsx",
        extends: "every <button> attribute",
      },
      {
        interface: "TabPanelProps",
        source: "packages/ui/src/tabs/Tabs.tsx",
        extends: "every <div> attribute",
      },
    ],
    keyboard: [
      { keys: "Tab", action: "Into the tab list (on the selected tab), then on to its panel." },
      { keys: "Left, Right", action: "Previous or next tab, wrapping and skipping disabled ones. Up and Down when vertical." },
      { keys: "Home, End", action: "First or last tab." },
      { keys: "Enter, Space", action: "Selects the focused tab (manual activation)." },
    ],
  },
  checkbox: {
    parts: [
      {
        interface: "CheckboxProps",
        source: "packages/ui/src/checkbox/Checkbox.tsx",
        extends: "every <input> attribute except type and size, including checked, defaultChecked, name and required",
        note: "Controlled or not, like a native checkbox: pass checked with onCheckedChange, or defaultChecked.",
      },
    ],
    keyboard: [{ keys: "Space", action: "Checks or unchecks. A mixed checkbox becomes checked." }],
  },
  switch: {
    parts: [
      {
        interface: "SwitchProps",
        source: "packages/ui/src/switch/Switch.tsx",
        extends: "every <input> attribute except type, size and role, including checked and defaultChecked",
        note: "For settings that take effect at once. A choice that waits for a Save button is a Checkbox.",
      },
    ],
    keyboard: [{ keys: "Space", action: "Turns it on or off." }],
  },
  slider: {
    parts: [
      {
        interface: "SliderProps",
        source: "packages/ui/src/slider/Slider.tsx",
        extends: "every <input> attribute except type and size, including name, disabled and onChange",
        note: "Controlled or not: pass value with onValueChange, or defaultValue.",
      },
    ],
    keyboard: [
      { keys: "Right, Up", action: "Up one step. In right-to-left text, Chrome and Firefox swap Left and Right to match the mirrored track; Safari doesn't." },
      { keys: "Left, Down", action: "Down one step." },
      { keys: "Page Up, Page Down", action: "A bigger step, where the browser supports it." },
      { keys: "Home, End", action: "To the minimum or maximum." },
    ],
  },
  progress: {
    parts: [
      {
        interface: "ProgressProps",
        source: "packages/ui/src/progress/Progress.tsx",
        extends: "every <progress> attribute except value and max",
      },
    ],
  },
  "radio-group": {
    parts: [
      {
        interface: "RadioGroupProps",
        source: "packages/ui/src/radio-group/RadioGroup.tsx",
        extends: "every <fieldset> attribute except onChange and defaultValue, including disabled",
      },
    ],
    keyboard: [
      { keys: "Tab", action: "Into the group, on the selected option (or the first, with none selected); Tab again leaves it." },
      { keys: "Down, Right", action: "Next option, selected at once, skipping disabled ones. Chrome and Firefox wrap at the end; Safari stops." },
      { keys: "Up, Left", action: "Previous option." },
      { keys: "Space", action: "Selects the focused option, when none is selected yet." },
    ],
  },
  "segmented-control": {
    parts: [
      {
        interface: "SegmentedControlProps",
        source: "packages/ui/src/segmented-control/SegmentedControl.tsx",
        extends: "every <div> attribute except onChange and defaultValue",
      },
    ],
    keyboard: [
      { keys: "Tab", action: "Into the group, on the selected option; Tab again leaves it." },
      { keys: "Right, Down", action: "Next option, selected at once; wraps and skips disabled ones. Mirrored in right-to-left text." },
      { keys: "Left, Up", action: "Previous option." },
      { keys: "Home, End", action: "First or last option." },
    ],
  },
  "toggle-group": {
    parts: [
      {
        interface: "ToggleGroupProps",
        source: "packages/ui/src/toggle-group/ToggleGroup.tsx",
        extends: "every <div> attribute except onChange and defaultValue",
        note: "Values are always an array, with or without multiple, in the options' order.",
      },
    ],
    keyboard: [
      { keys: "Tab", action: "Into the group, on the button last used (or the first pressed); Tab again leaves it." },
      { keys: "Right, Down", action: "Next button, without pressing it; wraps and skips disabled ones. Mirrored in right-to-left text." },
      { keys: "Left, Up", action: "Previous button." },
      { keys: "Home, End", action: "First or last button." },
      { keys: "Space, Enter", action: "Presses or releases the focused button." },
    ],
  },
  popover: {
    parts: [
      {
        interface: "PopoverProps",
        source: "packages/ui/src/popover/Popover.tsx",
        extends: "every <div> attribute except children and title",
        note: "Controlled or not: pass open with onOpenChange, or leave both out and the trigger toggles it.",
      },
    ],
    keyboard: [
      { keys: "Enter, Space", action: "On the trigger: opens it, with focus on the first control inside, or closes it." },
      { keys: "Tab", action: "Through the content, then on to the rest of the page. It stays open." },
      { keys: "Escape", action: "Closes it and returns focus to the trigger." },
    ],
  },
  "command-menu": {
    parts: [
      {
        interface: "CommandMenuProps",
        source: "packages/ui/src/command-menu/CommandMenu.tsx",
        extends: "every <dialog> attribute except open and onSelect",
      },
      {
        interface: "CommandItem",
        source: "packages/ui/src/command-menu/CommandMenu.tsx",
      },
    ],
    keyboard: [
      { keys: "Type", action: "Filters the list. Labels that start with what you typed come first." },
      { keys: "Down, Up", action: "Next or previous command, skipping disabled ones, wrapping." },
      { keys: "Enter", action: "Runs the current command and closes the menu." },
      { keys: "Escape", action: "Closes and returns focus to whatever opened it." },
    ],
  },
  tooltip: {
    parts: [
      {
        interface: "TooltipProps",
        source: "packages/ui/src/tooltip/Tooltip.tsx",
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
      },
      {
        interface: "ToastOptions",
        source: "packages/ui/src/toast/Toast.tsx",
        note: "Passed to toast() from useToast(), which returns the toast's id for dismiss().",
      },
    ],
  },
};
