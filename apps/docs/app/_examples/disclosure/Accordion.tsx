import { Disclosure } from "@keystone-ui/ui";

const FAQ = [
  ["Where do my notes live?", "On your devices, as plain files you own. Sync keeps a copy, encrypted end to end."],
  ["Can I export everything?", "Yes, any time, in one click, as Markdown."],
  ["What happens when I cancel?", "Your notes stay yours. Sync stops at the end of the billing period."],
] as const;

export function Accordion() {
  return (
    <div className="stack">
      {/* The same name makes them exclusive: opening one closes the others, natively. */}
      {FAQ.map(([question, answer], i) => (
        <Disclosure key={question} name="faq" variant="plain" summary={question} defaultOpen={i === 0}>
          <p className="disclosure-answer">{answer}</p>
        </Disclosure>
      ))}
    </div>
  );
}
