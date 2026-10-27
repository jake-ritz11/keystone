import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Determinate } from "../../_examples/progress/Determinate";
import { Indeterminate } from "../../_examples/progress/Indeterminate";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <DocPage
      title="Progress"
      lede="How far along some work is. When the amount isn't known yet, leave out the value and it shows the work is happening."
      builtOn={<code>&lt;progress&gt;</code>}
      source="packages/ui/src/progress"
    >
      <Section title="Examples">
        <Example title="With a value" file="progress/Determinate.tsx" note="A percentage by default; formatValue says it in the task's own units.">
          <Determinate />
        </Example>
        <Example
          title="Indeterminate"
          file="progress/Indeterminate.tsx"
          note="A band travels along the bar. With reduced motion it's stripes instead, so it can't be read as an amount."
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
            <>A native progress bar, named by its label and announced with its value.</>,
            <>
              It doesn&apos;t announce as it moves, which would be noise. Say when the work is done, with a toast or a
              status message.
            </>,
            <>Not focusable: it&apos;s a status, not a control. Screen readers find it while reading.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
