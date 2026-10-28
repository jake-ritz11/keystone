import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Segmented } from "../../_examples/segmented-control/Segmented";

export const metadata: Metadata = { title: "SegmentedControl" };

export default function SegmentedControlPage() {
  return (
    <DocPage
      title="SegmentedControl"
      lede="One choice from a few options shown side by side, for settings that change a view right away. Use Tabs for switching between panels of content."
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
            <>It is a radio group, so it is one Tab stop and is announced as &quot;2 of 3, selected&quot; instead of as three separate buttons.</>,
            <>A disabled option stays in the group and is announced as unavailable. The arrow keys skip it.</>,
            <>The selected option is shown by a raised surface and weight, not by color alone.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
