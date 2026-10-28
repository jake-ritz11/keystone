import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Filters } from "../../_examples/popover/Filters";
import { Share } from "../../_examples/popover/Share";

export const metadata: Metadata = { title: "Popover" };

export default function PopoverPage() {
  return (
    <DocPage
      title="Popover"
      lede="Interactive content beside the button that opened it, with the page still usable behind. For a list of actions, use a Menu; for a hint, a Tooltip; for something that needs an answer first, a Dialog."
      builtOn={
        <>
          the <code>popover</code> attribute and CSS anchor positioning
        </>
      }
      source="packages/ui/src/popover"
    >
      <Section title="Examples">
        <Example title="Share settings" file="popover/Share.tsx" note="Focus moves to the first control when it opens.">
          <Share />
        </Example>
        <Example
          title="Controlled, aligned to the end"
          file="popover/Filters.tsx"
          note="Apply closes it through open and onOpenChange. Each time it opens, it starts from what's applied."
        >
          <Filters />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="popover" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="popover" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              A non-modal dialog named by its title. The trigger says it opens a dialog and whether it&apos;s expanded,
              and the browser&apos;s <code>popovertarget</code> makes it a real toggle.
            </>,
            <>
              It sits right after its trigger in the page, so Tab moves through it and then on through the page; it
              doesn&apos;t trap focus.
            </>,
            <>
              Closing from inside returns focus to the trigger. A click elsewhere closes it and leaves focus where the
              click put it.
            </>,
            <>It fades in and out, and appears at once with reduced motion.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
