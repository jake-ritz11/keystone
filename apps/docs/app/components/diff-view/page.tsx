import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { NewAndDeleted } from "../../_examples/diff-view/NewAndDeleted";
import { ReviewDiff } from "../../_examples/diff-view/ReviewDiff";

export const metadata: Metadata = { title: "DiffView" };

export default function DiffViewPage() {
  return (
    <DocPage
      title="DiffView"
      lede="A unified diff for reviewing a change to one file, with room in the header for the decision."
      builtOn={<code>&lt;table&gt;</code>}
      source="packages/ui/src/diff-view"
    >
      <Section title="Examples">
        <Example title="Reviewing an edit" file="diff-view/ReviewDiff.tsx" note="The hunks come from diffHunks in agent-core, which is the diff engine of the agent.">
          <ReviewDiff />
        </Example>
        <Example title="New and deleted files" file="diff-view/NewAndDeleted.tsx">
          <NewAndDeleted />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="diff-view" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>It is a table, and each changed line says &quot;Added&quot; or &quot;Removed&quot; to screen readers, so color and the +/− signs are never the only signal.</>,
            <>The section is named by the file path, and its counts read as &quot;3 lines added, 1 lines removed&quot;.</>,
            <>Line numbers and signs cannot be selected, so copying a change copies only the code.</>,
            <>Long lines scroll sideways inside a focusable region instead of widening the page.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
