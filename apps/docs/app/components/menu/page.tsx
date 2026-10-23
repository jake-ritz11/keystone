import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { ActionsMenu } from "../../_examples/menu/ActionsMenu";
import { SortMenu } from "../../_examples/menu/SortMenu";

export const metadata: Metadata = { title: "Menu" };

export default function MenuPage() {
  return (
    <DocPage
      title="Menu"
      lede="A list of actions behind a button. For choosing a value, use Select; for navigation, use links."
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
          note="Icons, shortcut hints, a disabled item the arrow keys skip, and a destructive item set apart."
        >
          <ActionsMenu />
        </Example>
        <Example title="Aligned to the end" file="menu/SortMenu.tsx" note="Lines up with the trigger's right edge, and flips if there's no room below.">
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
              <code>aria-controls</code>; the menu is named by the trigger.
            </>,
            <>
              <code>popovertarget</code> makes the trigger a true toggle, and the browser handles light
              dismiss and Escape.
            </>,
            <>
              Disabled items use <code>aria-disabled</code>, so they're still announced in place; the
              arrow keys skip them.
            </>,
            <>Choosing an item, or Escape, returns focus to the trigger.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
