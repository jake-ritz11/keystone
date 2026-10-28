import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Settings } from "../../_examples/switch/Settings";

export const metadata: Metadata = { title: "Switch" };

export default function SwitchPage() {
  return (
    <DocPage
      title="Switch"
      lede="An on/off setting that applies the moment it changes. If a choice waits for a Save button, use a Checkbox."
      builtOn={
        <>
          a native checkbox with <code>role=&quot;switch&quot;</code>
        </>
      }
      source="packages/ui/src/switch"
    >
      <Section title="Examples">
        <Example title="A settings list" file="switch/Settings.tsx" note="The hint on the first switch says what the current state means.">
          <Settings />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="switch" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="switch" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>It is announced as a switch that is on or off, instead of a checkbox that is checked.</>,
            <>Name the setting instead of the action. &quot;Email alerts, switch, on&quot; reads correctly, and &quot;Turn on email alerts, switch, on&quot; does not.</>,
            <>On is shown by the position of the thumb and a fill, not color alone. In right-to-left text, on is to the left.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
