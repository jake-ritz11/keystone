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
      lede="Triggers an action. Use a link instead for going somewhere."
      builtOn={<code>&lt;button&gt;</code>}
      source="packages/ui/src/button"
    >
      <Section title="Examples">
        <Example title="Variants" file="button/Variants.tsx" note="Each view has one primary action, and the other buttons step down in weight.">
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
              It is a real <code>&lt;button&gt;</code> with <code>type=&quot;button&quot;</code> by default, so it never
              submits a form by accident.
            </>,
            <>
              While loading, it uses <code>aria-disabled</code> instead of <code>disabled</code> so that focus is not
              thrown back to the page in the middle of the action. It also sets <code>aria-busy</code>.
            </>,
            <>Icons are decorative, so an icon-only button needs a name. Pair it with a Tooltip of kind &quot;label&quot;.</>,
            <>The focus ring uses the focus token and shows for keyboard focus only.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
