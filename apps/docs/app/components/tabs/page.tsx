import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { SegmentedTabs } from "../../_examples/tabs/SegmentedTabs";
import { UnderlineTabs } from "../../_examples/tabs/UnderlineTabs";
import { VerticalTabs } from "../../_examples/tabs/VerticalTabs";

export const metadata: Metadata = { title: "Tabs" };

export default function TabsPage() {
  return (
    <DocPage
      title="Tabs"
      lede="Switch between views of the same thing without leaving the page."
      builtOn="the WAI-ARIA tabs pattern, on plain buttons"
      source="packages/ui/src/tabs"
    >
      <Section title="Examples">
        <Example title="Underline, automatic" file="tabs/UnderlineTabs.tsx" note="Billing is disabled, so the arrow keys skip it.">
          <UnderlineTabs />
        </Example>
        <Example title="Segmented, manual" file="tabs/SegmentedTabs.tsx" note="Manual activation suits panels that load something.">
          <SegmentedTabs />
        </Example>
        <Example title="Vertical" file="tabs/VerticalTabs.tsx">
          <VerticalTabs />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="tabs" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="tabs" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>One tab stop: only the selected tab is in the tab order, and Tab moves on to its panel.</>,
            <>Each tab controls its panel and each panel is named by its tab, both by id.</>,
            <>
              Panels are focusable, so keyboard users can reach a panel with nothing focusable in
              it.
            </>,
            <>The selected state is shown by weight and an indicator, not by color alone.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
