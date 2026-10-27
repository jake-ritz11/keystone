import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Palette } from "../../_examples/command-menu/Palette";

export const metadata: Metadata = { title: "CommandMenu" };

export default function CommandMenuPage() {
  return (
    <DocPage
      title="CommandMenu"
      lede="Every action in one searchable list: type a few letters, press Enter."
      builtOn={
        <>
          the native <code>&lt;dialog&gt;</code>, with the combobox pattern inside
        </>
      }
      source="packages/ui/src/command-menu"
    >
      <Section title="Examples">
        <Example
          title="Grouped, with shortcuts"
          file="command-menu/Palette.tsx"
          note="Try “dark”: keywords find commands their labels don't name. Export is disabled, so the arrow keys skip it."
        >
          <Palette />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="command-menu" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="command-menu" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              Focus stays in the search field the whole time. The field is a <code>combobox</code>; once the arrow
              keys move into the list, <code>aria-activedescendant</code> points at the current command. Before
              that, a screen reader reports the field, so people know they can type. Found with NVDA: pointing at
              the first command on open made it skip the field entirely.
            </>,
            <>The number of matching commands is read out as you type, not on every arrow key.</>,
            <>Groups are labelled groups, so a screen reader says which section a command is in.</>,
            <>
              Disabled commands stay in the list with <code>aria-disabled</code>, so people learn they exist; the
              arrow keys skip them.
            </>,
            <>
              Choosing a command closes the menu and returns focus first, then runs it, so a command that opens a
              dialog gets the right opener.
            </>,
            <>One highlight slides between commands; with reduced motion it jumps. In forced colors it&apos;s a system outline.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
