import type { Metadata } from "next";
import { DocPage, Example, KeyboardTable, Notes, PropsTables, Section } from "../../_docs/blocks";
import { IconLabel } from "../../_examples/tooltip/IconLabel";
import { Tooltips } from "../../_examples/tooltip/Tooltips";

export const metadata: Metadata = { title: "Tooltip" };

export default function TooltipPage() {
  return (
    <DocPage
      title="Tooltip"
      lede="A short hint on hover or keyboard focus. Never the only place for information someone needs, since touch screens don't show it."
      builtOn={
        <>
          a manual <code>popover</code> and CSS anchor positioning
        </>
      }
      source="packages/ui/src/tooltip"
    >
      <Section title="Examples">
        <Example
          title="Placement and delay"
          file="tooltip/Tooltips.tsx"
          note="After one tooltip closes, the next opens without the delay, so scanning a toolbar feels quick."
        >
          <Tooltips />
        </Example>
        <Example title="Naming an icon-only button" file="tooltip/IconLabel.tsx">
          <IconLabel />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="tooltip" />
      </Section>

      <Section title="Keyboard">
        <KeyboardTable component="tooltip" />
      </Section>

      <Section title="Accessibility">
        <p>Tooltips follow WCAG 1.4.13, Content on Hover or Focus:</p>
        <Notes
          items={[
            <>
              <strong>Dismissible:</strong> Escape hides it without moving focus or the pointer.
            </>,
            <>
              <strong>Hoverable:</strong> the pointer can move onto the tooltip without it closing.
            </>,
            <>
              <strong>Persistent:</strong> it stays until focus or hover leaves, or Escape.
            </>,
            <>
              It describes its trigger with <code>aria-describedby</code>, or names it with{" "}
              <code>aria-labelledby</code> when <code>kind=&quot;label&quot;</code>.
            </>,
            <>It opens on keyboard focus, but not when a mouse click focuses the trigger.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
