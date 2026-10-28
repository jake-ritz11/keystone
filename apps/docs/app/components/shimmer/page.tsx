import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Progress } from "../../_examples/shimmer/Progress";

export const metadata: Metadata = { title: "Shimmer" };

export default function ShimmerPage() {
  return (
    <DocPage
      title="Shimmer"
      lede="Live text that a light sweeps across while the work it names is happening."
      builtOn={<>a gradient painted into the text with <code>background-clip: text</code></>}
      source="packages/ui/src/shimmer"
    >
      <Section title="Examples">
        <Example title="While working, then done" file="shimmer/Progress.tsx" note="Finish stops the sweep, and the words stay so that the record of what happened does not disappear.">
          <Progress />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="shimmer" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>The words say what is happening, and the sweep only says that they are current, so nothing is lost without it.</>,
            <>The sweep is slow and linear, runs once every two seconds and pauses off the end, so it is calm enough to sit beside text that someone is reading.</>,
            <>Reduced motion stops the sweep and shows the plain text. Forced colors show system text, because the gradient is a background.</>,
            <>It is not a live region. If the change needs announcing, announce it once, where the state lives.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
