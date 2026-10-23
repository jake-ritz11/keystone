import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Segmented } from "../../_examples/segmented-control/Segmented";

export const metadata: Metadata = { title: "SegmentedControl" };

export default function SegmentedControlPage() {
  return (
    <DocPage
      title="SegmentedControl"
      lede="One choice from a few, side by side, for settings that change a view right away. For switching between panels of content, use Tabs."
      builtOn="the WAI-ARIA radio group pattern"
      source="packages/ui/src/segmented-control"
    >
      <Section title="Examples">
        <Example title="Controlled, and with a disabled option" file="segmented-control/Segmented.tsx">
          <Segmented />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="segmented-control" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="segmented-control" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>It&apos;s a radio group, so it&apos;s one Tab stop and announced as &quot;2 of 3, selected&quot;, not as three separate buttons.</>,
            <>A disabled option stays in the group and is announced as unavailable; the arrow keys skip it.</>,
            <>The selected option is shown by a raised surface and weight, not by color alone.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
