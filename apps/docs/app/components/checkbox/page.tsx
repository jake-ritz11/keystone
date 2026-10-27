import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { SelectAll } from "../../_examples/checkbox/SelectAll";
import { States } from "../../_examples/checkbox/States";

export const metadata: Metadata = { title: "Checkbox" };

export default function CheckboxPage() {
  return (
    <DocPage
      title="Checkbox"
      lede="Yes or no, for each of any number of things, applied when the form is submitted. For a setting that takes effect at once, use Switch."
      builtOn={
        <>
          the native <code>&lt;input type=&quot;checkbox&quot;&gt;</code>
        </>
      }
      source="packages/ui/src/checkbox"
    >
      <Section title="Examples">
        <Example title="Select all, with a mixed state" file="checkbox/SelectAll.tsx" note="Check one file: the first box turns to a dash.">
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
            <>It&apos;s a real checkbox, so it submits with a form, works with <code>required</code>, and the label toggles it.</>,
            <>The mixed state is the DOM&apos;s own <code>indeterminate</code>, announced as &quot;mixed&quot; or &quot;half checked&quot;.</>,
            <>The box&apos;s outline is 3:1 against the page, as WCAG asks of anything that identifies a control.</>,
            <>Checked is shown by a fill and a mark, not color alone. With reduced motion the check appears instead of drawing in.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
