import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { ActionsMenu } from "../../_examples/menu/ActionsMenu";
import { SortMenu } from "../../_examples/menu/SortMenu";

export const metadata: Metadata = { title: "Menu" };

export default function MenuPage() {
  return (
    <DocPage
      title="Menu"
      lede="A list of actions behind a button. Use Select for choosing a value, and links for navigation."
      builtOn={
        <>
          the <code>popover</code> attribute and CSS anchor positioning
        </>
      }
      source="packages/ui/src/menu"
    >
      <Section title="Examples">
        <Example
          title="Actions"
          file="menu/ActionsMenu.tsx"
          note="This menu has icons, shortcut hints, a disabled item that the arrow keys skip, and a destructive item set apart."
        >
          <ActionsMenu />
        </Example>
        <Example title="Aligned to the end" file="menu/SortMenu.tsx" note="The menu lines up with the right edge of the trigger, and flips if there is no room below.">
          <SortMenu />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="menu" />
        <p className="props-extends">
          <code>MenuSeparator</code> takes any <code>&lt;div&gt;</code> attribute.
        </p>
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="menu" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              The trigger gets <code>aria-haspopup</code>, <code>aria-expanded</code> and{" "}
              <code>aria-controls</code>. The menu is named by the trigger.
            </>,
            <>
              <code>popovertarget</code> makes the trigger a true toggle, and the browser handles light
              dismiss and Escape.
            </>,
            <>
              Disabled items use <code>aria-disabled</code>, so they are still announced in place. The
              arrow keys skip them.
            </>,
            <>Choosing an item, or pressing Escape, returns focus to the trigger.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
