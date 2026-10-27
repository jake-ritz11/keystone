import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Settings } from "../../_examples/slider/Settings";
import { States } from "../../_examples/slider/States";

export const metadata: Metadata = { title: "Slider" };

export default function SliderPage() {
  return (
    <DocPage
      title="Slider"
      lede="A number picked from a range, where the rough position matters more than the exact value. For an exact number, use an Input."
      builtOn={<code>&lt;input type=&quot;range&quot;&gt;</code>}
      source="packages/ui/src/slider"
    >
      <Section title="Examples">
        <Example
          title="Formatted values"
          file="slider/Settings.tsx"
          note="formatValue sets what's shown and what's announced, so a screen reader hears “8 steps”, not “8”."
        >
          <Settings />
        </Example>
        <Example title="Disabled and with a hidden label" file="slider/States.tsx" note="Hiding the label keeps the value on show.">
          <States />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="slider" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="slider" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>A native range, so it&apos;s announced as a slider with its value, and every key below comes from the browser.</>,
            <>
              The value beside the label is visual only. The input announces its own value, through{" "}
              <code>aria-valuetext</code> when <code>formatValue</code> is set, so it isn&apos;t read twice.
            </>,
            <>The unfilled track meets the 3:1 contrast WCAG asks of a control&apos;s outline, in every theme.</>,
            <>In right-to-left text the minimum is on the right, and the fill grows from there.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
