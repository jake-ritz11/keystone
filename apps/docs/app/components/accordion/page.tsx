import type { Metadata } from "next";
import Link from "next/link";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Questions } from "../../_examples/accordion/Questions";
import { Steps } from "../../_examples/accordion/Steps";

export const metadata: Metadata = { title: "Accordion" };

export default function AccordionPage() {
  return (
    <DocPage
      title="Accordion"
      lede="Sections under headings, opened one at a time or several. For a single section, or a group that doesn't need headings, a Disclosure is lighter."
      builtOn={
        <>
          headings with <code>aria-expanded</code> buttons, and <code>hidden=&quot;until-found&quot;</code>
        </>
      }
      source="packages/ui/src/accordion"
    >
      <Section title="Examples">
        <Example title="One open at a time" file="accordion/Questions.tsx" note="Opening one closes the others, and opening the open one closes it. The titles are h4s, to sit under this page's h3s.">
          <Questions />
        </Example>
        <Example
          title="Several open, controlled, with a status"
          file="accordion/Steps.tsx"
          note="multiple lets any number stay open; value and onValueChange drive Expand all."
        >
          <Steps />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="accordion" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="accordion" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              Each title is a heading containing the button, so screen-reader users can move between sections by
              heading, which a <code>&lt;details&gt;</code> summary can&apos;t offer. Set <code>headingLevel</code> to
              fit the page&apos;s outline.
            </>,
            <>The button says whether its section is expanded, and each open section is a region named by its title.</>,
            <>
              Closed sections stay findable: find-in-page searches them and opens the one with the match, as it does for{" "}
              <Link href="/components/disclosure">Disclosure</Link>.
            </>,
            <>The chevron turns without motion when reduced motion is on, and mirrors in right-to-left text.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
