import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Basics } from "../../_examples/select/Basics";
import { GroupsAndErrors } from "../../_examples/select/GroupsAndErrors";
import { Sizes } from "../../_examples/select/Sizes";

export const metadata: Metadata = { title: "Select" };

export default function SelectPage() {
  return (
    <DocPage
      title="Select"
      lede="Pick one option from a list. It's a real select, so the keyboard model, mobile pickers and form submission come from the browser."
      builtOn={
        <>
          <code>&lt;select&gt;</code> and <code>appearance: base-select</code>
        </>
      }
      source="packages/ui/src/select"
    >
      <Section title="Examples">
        <Example title="Default and placeholder" file="select/Basics.tsx" note="With a placeholder and required, the prompt can't be chosen.">
          <Basics />
        </Example>
        <Example title="Groups, error and disabled" file="select/GroupsAndErrors.tsx">
          <GroupsAndErrors />
        </Example>
        <Example title="Sizes" file="select/Sizes.tsx">
          <Sizes />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="select" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="select" />
      </Section>

      <Section title="Why native">
        <p>
          A custom listbox would allow total visual control, at the cost of re-implementing a
          keyboard model, typeahead, mobile behavior and form participation that the browser
          already gets right. Keystone styles the closed control from tokens everywhere. Where the
          browser supports <code>appearance: base-select</code>, the open popup is styled from
          tokens too; elsewhere it falls back to the operating system's picker, which still works
          fully.
        </p>
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>Label, hint and error are wired exactly as in Input.</>,
            <>Disabled options stay in the list, announced as unavailable, so people can see what exists.</>,
            <>The placeholder renders in the muted color while it's selected, so it reads as a prompt, not a value.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
