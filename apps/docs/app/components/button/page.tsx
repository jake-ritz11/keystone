import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Icons } from "../../_examples/button/Icons";
import { Loading } from "../../_examples/button/Loading";
import { Sizes } from "../../_examples/button/Sizes";
import { Variants } from "../../_examples/button/Variants";

export const metadata: Metadata = { title: "Button" };

export default function ButtonPage() {
  return (
    <DocPage
      title="Button"
      lede="Triggers an action. For going somewhere, use a link instead."
      builtOn={<code>&lt;button&gt;</code>}
      source="packages/ui/src/button"
    >
      <Section title="Examples">
        <Example title="Variants" file="button/Variants.tsx" note="One primary action per view; the rest step down in weight.">
          <Variants />
        </Example>
        <Example title="Sizes" file="button/Sizes.tsx">
          <Sizes />
        </Example>
        <Example
          title="Loading and disabled"
          file="button/Loading.tsx"
          note="Loading keeps the button focusable and announces aria-busy. Disabled removes it from the tab order."
        >
          <Loading />
        </Example>
        <Example title="With icons" file="button/Icons.tsx">
          <Icons />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="button" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="button" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              A real <code>&lt;button&gt;</code> with <code>type=&quot;button&quot;</code> by default, so it never
              submits a form by accident.
            </>,
            <>
              While loading it uses <code>aria-disabled</code> rather than <code>disabled</code>, so focus isn&apos;t
              thrown back to the page mid-action, and sets <code>aria-busy</code>.
            </>,
            <>Icons are decorative. An icon-only button needs a name: pair it with a Tooltip of kind &quot;label&quot;.</>,
            <>The focus ring uses the focus token and shows for keyboard focus only.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
