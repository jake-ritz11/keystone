import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Approval } from "../../_examples/radio-group/Approval";
import { Required } from "../../_examples/radio-group/Required";

export const metadata: Metadata = { title: "RadioGroup" };

export default function RadioGroupPage() {
  return (
    <DocPage
      title="RadioGroup"
      lede="One answer from a short list, with every option and its consequences in view. For switching a view in place, use SegmentedControl."
      builtOn={
        <>
          native radios in a <code>&lt;fieldset&gt;</code>
        </>
      }
      source="packages/ui/src/radio-group"
    >
      <Section title="Examples">
        <Example title="Options with hints" file="radio-group/Approval.tsx">
          <Approval />
        </Example>
        <Example
          title="Required, in a row"
          file="radio-group/Required.tsx"
          note="Press Continue with nothing chosen: the browser stops the form and the error appears."
        >
          <Required />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="radio-group" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="radio-group" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>The legend names the group, so a screen reader reads the question before the first answer.</>,
            <>The browser supplies the keyboard model: one Tab stop, arrows that select, and required validation.</>,
            <>Each option&apos;s hint is tied to that option, so it&apos;s read only when that option is reached.</>,
            <>Selected is shown by a fill and a dot, not color alone.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
