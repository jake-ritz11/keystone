import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Settings } from "../../_examples/switch/Settings";

export const metadata: Metadata = { title: "Switch" };

export default function SwitchPage() {
  return (
    <DocPage
      title="Switch"
      lede="An on/off setting that applies the moment it changes. If a choice waits for a Save button, it's a Checkbox."
      builtOn={
        <>
          a native checkbox with <code>role=&quot;switch&quot;</code>
        </>
      }
      source="packages/ui/src/switch"
    >
      <Section title="Examples">
        <Example title="A settings list" file="switch/Settings.tsx" note="The first switch's hint says what the current state means.">
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
            <>Announced as a switch, on or off, rather than a checkbox that&apos;s checked.</>,
            <>Name the setting, not the action. &quot;Email alerts, switch, on&quot; reads right; &quot;Turn on email alerts, switch, on&quot; doesn&apos;t.</>,
            <>On is shown by the thumb&apos;s position and a fill, not color alone. In right-to-left text, on is to the left.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
