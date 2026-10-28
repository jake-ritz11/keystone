import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Basics } from "../../_examples/input/Basics";
import { IconsAndSizes } from "../../_examples/input/IconsAndSizes";
import { States } from "../../_examples/input/States";
import { Validation } from "../../_examples/input/Validation";

export const metadata: Metadata = { title: "Input" };

export default function InputPage() {
  return (
    <DocPage
      title="Input"
      lede="A labelled text field. The label, hint and error are part of the component, so they are always wired up."
      builtOn={<code>&lt;input&gt;</code>}
      source="packages/ui/src/input"
    >
      <Section title="Examples">
        <Example title="Label, hint and required" file="input/Basics.tsx">
          <Basics />
        </Example>
        <Example
          title="Validation"
          file="input/Validation.tsx"
          note="Try “admin”, or clear the field. The error appears on blur and is read out with the field."
        >
          <Validation />
        </Example>
        <Example title="Read-only and disabled" file="input/States.tsx">
          <States />
        </Example>
        <Example title="Icon, hidden label and sizes" file="input/IconsAndSizes.tsx">
          <IconsAndSizes />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="input" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              <code>label</code> is required. With <code>hideLabel</code>, the label is visually hidden but still
              names the field. A placeholder is never used as the label.
            </>,
            <>
              Hint and error are linked with <code>aria-describedby</code>, error first, so a screen
              reader reads the problem before the help.
            </>,
            <>
              An error sets <code>aria-invalid</code> and a danger border. The error text carries the meaning, so
              color is not the only signal.
            </>,
            <>
              Required fields use the native <code>required</code> attribute, which is what is
              announced. The asterisk is hidden from assistive technology.
            </>,
            <>
              There is only ever one line. Hover darkens the border, and focus turns it the focus color with a
              soft blurred glow. Windows high contrast mode drops shadows, so there focus falls back to a real
              outline.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
