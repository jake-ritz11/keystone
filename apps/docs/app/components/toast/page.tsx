import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { ActionAndPersistent } from "../../_examples/toast/ActionAndPersistent";
import { OverDialog } from "../../_examples/toast/OverDialog";
import { Tones } from "../../_examples/toast/Tones";

export const metadata: Metadata = { title: "Toast" };

export default function ToastPage() {
  return (
    <DocPage
      title="Toast"
      lede="A brief, non-blocking message about something that just happened. Wrap the app in ToastProvider once, then call toast() from useToast()."
      builtOn={
        <>
          a manual <code>popover</code> and ARIA live regions
        </>
      }
      source="packages/ui/src/toast"
    >
      <Section title="Examples">
        <Example title="Tones" file="toast/Tones.tsx" note="Each tone has its own icon, so color is not the only signal.">
          <Tones />
        </Example>
        <Example title="Action and persistent" file="toast/ActionAndPersistent.tsx">
          <ActionAndPersistent />
        </Example>
        <Example title="Over a modal" file="toast/OverDialog.tsx">
          <OverDialog />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="toast" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>
              Messages are announced through live regions that are always in the page, because a
              region added at the same moment as its text is often missed. Danger toasts use the assertive one.
            </>,
            <>
              Timers pause while the pointer or focus is on the stack, so nobody loses a message in the middle of reading
              it (WCAG 2.2.1).
            </>,
            <>Every toast has a dismiss button named after its message.</>,
            <>
              While a modal is open, the whole layer moves inside it. Otherwise the modal would make the layer inert, so
              it would be visible but neither clickable nor announced.
            </>,
            <>Actions time out with the toast, so put the same action somewhere permanent too.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
