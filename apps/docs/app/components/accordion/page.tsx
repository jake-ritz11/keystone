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
      lede="Sections under headings that open one at a time or several at once. A Disclosure is lighter for a single section, or for a group that does not need headings."
      builtOn={
        <>
          headings with <code>aria-expanded</code> buttons, and <code>hidden=&quot;until-found&quot;</code>
        </>
      }
      source="packages/ui/src/accordion"
    >
      <Section title="Examples">
        <Example title="One open at a time" file="accordion/Questions.tsx" note="Opening a section closes the others, and opening the section that is already open closes it. The titles are h4s because they sit under the h3s of this page.">
          <Questions />
        </Example>
        <Example
          title="Several open, controlled, with a status"
          file="accordion/Steps.tsx"
          note="multiple lets any number of sections stay open. Expand all works through value and onValueChange."
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
              heading. A <code>&lt;details&gt;</code> summary cannot offer this. Set <code>headingLevel</code> to fit
              the outline of the page.
            </>,
            <>The button says whether its section is expanded, and each open section is a region named by its title.</>,
            <>
              Find-in-page searches closed sections too and opens the one with the match, as it does for{" "}
              <Link href="/components/disclosure">Disclosure</Link>.
            </>,
            <>The chevron turns without motion when reduced motion is on, and mirrors in right-to-left text.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
