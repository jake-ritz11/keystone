import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { ConfirmDialog } from "../../_examples/dialog/ConfirmDialog";
import { FormDialog } from "../../_examples/dialog/FormDialog";
import { LongDialog } from "../../_examples/dialog/LongDialog";
import { SmallDialog } from "../../_examples/dialog/SmallDialog";

export const metadata: Metadata = { title: "Dialog" };

export default function DialogPage() {
  return (
    <DocPage
      title="Dialog"
      lede="A modal for a focused task or a decision that has to be made before going on."
      builtOn={
        <>
          <code>&lt;dialog&gt;</code> and <code>showModal()</code>
        </>
      }
      source="packages/ui/src/dialog"
    >
      <Section title="Examples">
        <Example title="Form" file="dialog/FormDialog.tsx" note="Not dismissible by a backdrop click, because it holds input.">
          <FormDialog />
        </Example>
        <Example title="Confirmation" file="dialog/ConfirmDialog.tsx" note={<>An <code>alertdialog</code>: focus starts on the safe choice.</>}>
          <ConfirmDialog />
        </Example>
        <Example title="Long content" file="dialog/LongDialog.tsx" note="The body scrolls; title and footer stay put.">
          <LongDialog />
        </Example>
        <Example title="Small, dismissible" file="dialog/SmallDialog.tsx">
          <SmallDialog />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="dialog" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="dialog" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              <code>showModal()</code> puts the dialog in the top layer and makes the rest of the page
              inert, so focus can't escape and screen readers can't wander behind it.
            </>,
            <>The title names the dialog and the description describes it, both by id.</>,
            <>
              Focus returns to whatever opened the dialog, including in Safari, where clicking a
              button doesn't focus it.
            </>,
            <>A backdrop click only counts if the press also started on the backdrop, so dragging out of a text field doesn't close it.</>,
            <>With reduced motion, it fades without moving.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
