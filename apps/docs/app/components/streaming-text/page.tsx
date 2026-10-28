import type { Metadata } from "next";
import { DocPage, Example, Notes, PropsTables, Section } from "../../_docs/blocks";
import { Response } from "../../_examples/streaming-text/Response";

export const metadata: Metadata = { title: "StreamingText" };

export default function StreamingTextPage() {
  return (
    <DocPage
      title="StreamingText"
      lede="Text that arrives while someone is reading it, such as a model's response. Screen readers hear it a sentence at a time, instead of a token at a time or not at all."
      builtOn={<>a polite live region kept apart from the visible text</>}
      source="packages/ui/src/streaming-text"
    >
      <Section title="Examples">
        <Example
          title="A response, and what a screen reader is given"
          file="streaming-text/Response.tsx"
          note="The list under the response is read from the live region, so it shows what assistive technology receives. Partway through, the stream pauses mid-sentence, as a model does before it calls a tool, and the unfinished sentence is announced after the pause."
        >
          <Response />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTables component="streaming-text" />
      </Section>

      <Section title="Accessibility">
        <Notes
          items={[
            <>The visible text is not a live region. A live region whose text grows on every token is re-read, cut off or skipped, depending on the screen reader.</>,
            <>A separate, visually hidden region receives whole sentences. Everything that finished in one burst is one announcement, and an unfinished sentence waits until it ends, until the stream ends, or until the stream has stalled for the length of <code>pause</code>.</>,
            <>Full stops inside inline code, in numbers and after common abbreviations do not end a sentence. Markdown marks are removed, so a screen reader does not read out backticks or asterisks.</>,
            <>Text that was already complete when the component mounted is not announced, so scrolling back through a conversation stays quiet.</>,
            <>Once the stream ends, the last announcement is removed after five seconds, so that a screen reader's reading cursor does not find the final sentence twice.</>,
            <>The caret is decorative and hidden from assistive technology. With reduced motion it stops breathing, and in forced colors it uses the system text color.</>,
            <>
              <code>announce=&quot;end&quot;</code> says the whole response once it is complete, which some people prefer for short replies. <code>&quot;off&quot;</code> is for a page that announces the response another way.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  );
}
