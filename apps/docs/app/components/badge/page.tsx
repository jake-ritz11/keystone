import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Badges } from "../../_examples/badge/Badges";

export const metadata: Metadata = { title: "Badge" };

export default function BadgePage() {
  return (
    <DocPage title="Badge" lede="A short, static label for a status or a category." builtOn={<code>&lt;span&gt;</code>} source="packages/ui/src/badge">
      <Section title="Examples">
        <Example title="Tones and status dots" file="badge/Badges.tsx">
          <Badges />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="badge" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>The text carries the meaning; tone and dot are reinforcement. &quot;Failed&quot; reads as failed in any color.</>,
            <>Tinted text is mixed toward the body text color so it keeps readable contrast on its tint in both themes.</>,
            <>A badge isn&apos;t interactive. If it needs to do something, it&apos;s a Button.</>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
