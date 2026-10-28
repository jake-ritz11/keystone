import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Filters } from "../../_examples/popover/Filters";
import { Share } from "../../_examples/popover/Share";

export const metadata: Metadata = { title: "Popover" };

export default function PopoverPage() {
  return (
    <DocPage
      title="Popover"
      lede="Interactive content beside the button that opened it, while the page behind stays usable. Use a Menu for a list of actions, a Tooltip for a hint, and a Dialog for something that needs an answer first."
      builtOn={
        <>
          the <code>popover</code> attribute and CSS anchor positioning
        </>
      }
      source="packages/ui/src/popover"
    >
      <Section title="Examples">
        <Example title="Share settings" file="popover/Share.tsx" note="When the popover opens, focus moves to the first control.">
          <Share />
        </Example>
        <Example
          title="Controlled, aligned to the end"
          file="popover/Filters.tsx"
          note="Apply closes the popover through open and onOpenChange. Each time it opens, it starts from what is applied."
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
              The popover is a non-modal dialog named by its title. The trigger says that it opens a dialog and whether
              it is expanded, and <code>popovertarget</code>, which the browser handles, makes it a real toggle.
            </>,
            <>
              It sits right after its trigger in the page, so Tab moves through it and then on through the page. It
              does not trap focus.
            </>,
            <>
              Closing from inside returns focus to the trigger. A click elsewhere closes it and leaves focus where the
              click put it.
            </>,
            <>It fades in and out, and with reduced motion it appears at once.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
