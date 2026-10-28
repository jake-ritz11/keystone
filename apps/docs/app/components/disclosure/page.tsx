import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Accordion } from "../../_examples/disclosure/Accordion";
import { Disclosures } from "../../_examples/disclosure/Disclosures";

export const metadata: Metadata = { title: "Disclosure" };

export default function DisclosurePage() {
  return (
    <DocPage
      title="Disclosure"
      lede="Show and hide a section of detail, like a tool call's output or an answer to a question."
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
        <Example title="Exclusive group" file="disclosure/Accordion.tsx" note="Opening one closes the others, through the native name attribute. When the sections need headings or arrow keys, use Accordion.">
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
            <>The summary is announced as a button that&apos;s expanded or collapsed, by the browser, with no ARIA added.</>,
            <>Find-in-page searches closed content too, and opens the section with the match.</>,
            <>Where supported, it animates its height open and closed; with reduced motion, it doesn&apos;t.</>,
            <>The meta slot is part of the summary, so a status like &quot;Failed&quot; is read with the line it belongs to.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
