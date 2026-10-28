import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Determinate } from "../../_examples/progress/Determinate";
import { Indeterminate } from "../../_examples/progress/Indeterminate";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <DocPage
      title="Progress"
      lede="Shows how far along some work is. When the amount is not known yet, leave out the value, and the bar shows that the work is happening."
      builtOn={<code>&lt;progress&gt;</code>}
      source="packages/ui/src/progress"
    >
      <Section title="Examples">
        <Example title="With a value" file="progress/Determinate.tsx" note="The value is a percentage by default, and formatValue states it in the units of the task.">
          <Determinate />
        </Example>
        <Example
          title="Indeterminate"
          file="progress/Indeterminate.tsx"
          note="A band travels along the bar. With reduced motion the bar shows stripes instead, so that it cannot be read as an amount."
        >
          <Indeterminate />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="progress" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>It is a native progress bar, named by its label and announced with its value.</>,
            <>
              It does not announce as it moves, because that would be noise. Say when the work is done with a toast or
              a status message.
            </>,
            <>It is not focusable, because it is a status and not a control. Screen readers find it while reading.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
