import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Accordion } from "../../_examples/disclosure/Accordion";
import { Disclosures } from "../../_examples/disclosure/Disclosures";

export const metadata: Metadata = { title: "Disclosure" };

export default function DisclosurePage() {
  return (
    <DocPage
      title="Disclosure"
      lede="Shows and hides a section of detail, such as the output of a tool call or the answer to a question."
      builtOn={
        <>
          <code>&lt;details&gt;</code> and <code>&lt;summary&gt;</code>
        </>
      }
      source="packages/ui/src/disclosure"
    >
      <Section title="Examples">
        <Example title="Bordered, with a status" file="disclosure/Disclosures.tsx">
          <Disclosures />
        </Example>
        <Example title="Exclusive group" file="disclosure/Accordion.tsx" note="The native name attribute makes opening one section close the others. Use Accordion when the sections need headings or arrow keys.">
          <Accordion />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="disclosure" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="disclosure" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>The browser announces the summary as a button that is expanded or collapsed, with no ARIA added.</>,
            <>Find-in-page searches closed content too and opens the section with the match.</>,
            <>Where the browser supports it, the section animates its height as it opens and closes. With reduced motion it does not animate.</>,
            <>The meta slot is part of the summary, so a status such as &quot;Failed&quot; is read with the line it belongs to.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
