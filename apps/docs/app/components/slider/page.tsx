import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Settings } from "../../_examples/slider/Settings";
import { States } from "../../_examples/slider/States";

export const metadata: Metadata = { title: "Slider" };

export default function SliderPage() {
  return (
    <DocPage
      title="Slider"
      lede="A number picked from a range, where the rough position matters more than the exact value. Use an Input for an exact number."
      builtOn={<code>&lt;input type=&quot;range&quot;&gt;</code>}
      source="packages/ui/src/slider"
    >
      <Section title="Examples">
        <Example
          title="Formatted values"
          file="slider/Settings.tsx"
          note="formatValue sets what is shown and what is announced, so a screen reader hears “8 steps” instead of “8”."
        >
          <Settings />
        </Example>
        <Example title="Disabled and with a hidden label" file="slider/States.tsx" note="The value stays visible when the label is hidden.">
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
            <>It is a native range, so it is announced as a slider with its value, and every key below comes from the browser.</>,
            <>
              The value beside the label is visual only. The input announces its own value, through{" "}
              <code>aria-valuetext</code> when <code>formatValue</code> is set, so it is not read twice.
            </>,
            <>The unfilled track meets the 3:1 contrast that WCAG asks of a control outline, in every theme.</>,
            <>In right-to-left text the minimum is on the right, and the fill grows from there.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
