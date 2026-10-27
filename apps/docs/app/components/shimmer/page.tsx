import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Progress } from "../../_examples/shimmer/Progress";

export const metadata: Metadata = { title: "Shimmer" };

export default function ShimmerPage() {
  return (
    <DocPage
      title="Shimmer"
      lede="Live text: a light sweeps across it while the work it names is happening."
      builtOn={<>a gradient painted into the text with <code>background-clip: text</code></>}
      source="packages/ui/src/shimmer"
    >
      <Section title="Examples">
        <Example title="While working, then done" file="shimmer/Progress.tsx" note="Finish stops the sweep; the words stay, so the record of what happened doesn't disappear.">
          <Progress />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="shimmer" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>The words say what&apos;s happening. The sweep only says they&apos;re current, so nothing is lost without it.</>,
            <>One slow sweep every two seconds, linear, with a pause off the end: calm enough to sit beside text someone is reading.</>,
            <>Reduced motion stops the sweep and shows the plain text. Forced colors show system text, since the gradient is a background.</>,
            <>It isn&apos;t a live region. If the change needs announcing, announce it where the state lives, once.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
