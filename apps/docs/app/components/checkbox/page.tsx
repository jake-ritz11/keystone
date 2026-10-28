import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { SelectAll } from "../../_examples/checkbox/SelectAll";
import { States } from "../../_examples/checkbox/States";

export const metadata: Metadata = { title: "Checkbox" };

export default function CheckboxPage() {
  return (
    <DocPage
      title="Checkbox"
      lede="A yes-or-no choice for each of any number of things, applied when the form is submitted. Use Switch for a setting that takes effect at once."
      builtOn={
        <>
          the native <code>&lt;input type=&quot;checkbox&quot;&gt;</code>
        </>
      }
      source="packages/ui/src/checkbox"
    >
      <Section title="Examples">
        <Example title="Select all, with a mixed state" file="checkbox/SelectAll.tsx" note="Checking one file turns the first box to a dash.">
          <SelectAll />
        </Example>
        <Example title="Hint, error and disabled" file="checkbox/States.tsx">
          <States />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="checkbox" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="checkbox" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>It is a real checkbox, so it submits with a form, works with <code>required</code>, and the label toggles it.</>,
            <>The mixed state uses the DOM <code>indeterminate</code> property, which is announced as &quot;mixed&quot; or &quot;half checked&quot;.</>,
            <>The outline of the box is 3:1 against the page, as WCAG asks of anything that identifies a control.</>,
            <>Checked is shown by a fill and a mark, not color alone. With reduced motion, the check appears instead of drawing in.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
