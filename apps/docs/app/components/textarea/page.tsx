import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Composer } from "../../_examples/textarea/Composer";
import { States } from "../../_examples/textarea/States";

export const metadata: Metadata = { title: "Textarea" };

export default function TextareaPage() {
  return (
    <DocPage
      title="Textarea"
      lede="Multi-line text that grows as you type up to a limit and then scrolls. It shares the label, hint, error and focus treatment of Input."
      builtOn={
        <>
          <code>&lt;textarea&gt;</code> and <code>field-sizing: content</code>
        </>
      }
      source="packages/ui/src/textarea"
    >
      <Section title="Examples">
        <Example title="Composer" file="textarea/Composer.tsx" note="The field grows from two lines to eight. Enter sends, and Shift+Enter adds a line.">
          <Composer />
        </Example>
        <Example title="States" file="textarea/States.tsx">
          <States />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="textarea" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>Label, hint and error are wired exactly as in Input, and the error takes the line of the hint instead of adding one.</>,
            <>
              Auto-resize uses CSS (<code>field-sizing: content</code>) instead of a script that measures
              the text, so there is no flicker as it grows. Browsers without it fall back to <code>rows</code> and a resize handle.
            </>,
            <>
              In the composer example, Enter is ignored while an input method is composing text, so people typing in
              Japanese, Chinese or Korean do not send half-finished words.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
