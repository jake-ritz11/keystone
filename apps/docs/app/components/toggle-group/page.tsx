import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Filters } from "../../_examples/toggle-group/Filters";
import { Formatting } from "../../_examples/toggle-group/Formatting";

export const metadata: Metadata = { title: "ToggleGroup" };

export default function ToggleGroupPage() {
  return (
    <DocPage
      title="ToggleGroup"
      lede="Buttons that stay pressed, side by side: formatting, filters, view options. If exactly one must always be chosen, use a SegmentedControl."
      builtOn={
        <>
          <code>&lt;button aria-pressed&gt;</code> in a group
        </>
      }
      source="packages/ui/src/toggle-group"
    >
      <Section title="Examples">
        <Example
          title="Icons, any number pressed"
          file="toggle-group/Formatting.tsx"
          note="iconOnly hides the labels visually; they still name each button."
        >
          <Formatting />
        </Example>
        <Example
          title="Filters, and at most one"
          file="toggle-group/Filters.tsx"
          note="Without multiple, pressing one releases the other, and pressing it again leaves none pressed."
        >
          <Filters />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="toggle-group" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="toggle-group" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>Each button is announced as a toggle button, pressed or not pressed, inside a named group.</>,
            <>
              One Tab stop, like a toolbar, so a long row doesn&apos;t cost a Tab press per button. The arrow keys only
              move: pressing is always Space or Enter, since each button is its own setting.
            </>,
            <>Pressed is a filled button, a change in lightness rather than hue alone, in every theme.</>,
            <>The arrow keys skip a disabled button, but it&apos;s still announced in place, so people know it exists.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
