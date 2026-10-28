import { test } from "node:test";
import assert from "node:assert/strict";
import { extractProps, typeAliases } from "./props.ts";

// The shapes Keystone's components are written in. If a component needs a new one, add it here
// first, so the parser's limits are written down rather than discovered.

const SOURCE = `
export type Size = "sm" | "md";

export interface ThingProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onChange"> {
  /** Names it. It's announced, so it's required. */
  label: ReactNode;
  /**
   * How big it is,
   * on two lines.
   */
  size?: Size;
  /** @default the first option */
  value?: string;
  "aria-label"?: string;
  /** Called with the new value. */
  onValueChange?: (value: string, reason: { source: "key" | "pointer" }) => void;
}

export const Thing = forwardRef<HTMLDivElement, ThingProps>(function Thing(
  { label, size = "md", value, onValueChange, ...rest },
  ref,
) {});
`;

test("reads names, types, required, JSDoc and destructured defaults, in source order", () => {
  assert.deepEqual(extractProps(SOURCE, "ThingProps", typeAliases(SOURCE)), [
    { name: "label", type: "ReactNode", required: true, description: "Names it. It's announced, so it's required." },
    { name: "size", type: '"sm" | "md"', default: '"md"', description: "How big it is, on two lines." },
    { name: "value", type: "string", default: "the first option", description: "" },
    { name: "aria-label", type: "string", description: "" },
    {
      name: "onValueChange",
      type: '(value: string, reason: { source: "key" | "pointer" }) => void',
      description: "Called with the new value.",
    },
  ]);
});

test("a generic interface reads its type parameters as their constraints", () => {
  const source = `
export interface PickProps<T extends string> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * The choices.
   * @docsType { value, label }[]
   */
  options: Option<T>[];
  value?: T[];
}

function PickInner<T extends string>({ options, value = [] }: PickProps<T>, ref: Ref) {}
`;
  assert.deepEqual(extractProps(source, "PickProps"), [
    { name: "options", type: "{ value, label }[]", required: true, description: "The choices." },
    { name: "value", type: "string[]", default: "[]", description: "" },
  ]);
});

test("defaults come from an annotated destructuring too, and renamed props keep their own name", () => {
  const source = `
export interface MenuProps {
  align?: "start" | "end";
  open?: boolean;
}
export function Menu({ align = "start", open: controlled = false }: MenuProps) {}
`;
  assert.deepEqual(
    extractProps(source, "MenuProps").map((p) => [p.name, p.default]),
    [
      ["align", '"start"'],
      ["open", "false"],
    ],
  );
});

test("apostrophes and braces in comments don't confuse it", () => {
  const source = `
export interface NoteProps {
  /** It's here: { not a type }; and "quotes" don't end it. */
  text: string;
  // A line comment, isn't a member: either.
  tone?: "a" | "b";
}
`;
  assert.deepEqual(
    extractProps(source, "NoteProps").map((p) => [p.name, p.type, p.description]),
    [
      ["text", "string", 'It\'s here: { not a type }; and "quotes" don\'t end it.'],
      ["tone", '"a" | "b"', ""],
    ],
  );
});

test("an interface that isn't there is an error, not an empty table", () => {
  assert.throws(() => extractProps(SOURCE, "MissingProps"), /MissingProps not found/);
});
