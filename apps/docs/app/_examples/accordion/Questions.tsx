import { Accordion, AccordionItem } from "@keystone-ui/ui";

export function Questions() {
  return (
    <Accordion defaultValue={["files"]} headingLevel={4}>
      <AccordionItem value="files" title="Which files can the agent change?">
        <p className="disclosure-answer">Only files in the project you opened. Every edit shows as a diff before or after it applies.</p>
      </AccordionItem>
      <AccordionItem value="undo" title="Can I undo an edit?">
        <p className="disclosure-answer">Yes. Each edit can be reverted on its own, at any point in the session.</p>
      </AccordionItem>
      <AccordionItem value="keys" title="Where is my API key kept?">
        <p className="disclosure-answer">On the server, as an environment variable. It never reaches the browser.</p>
      </AccordionItem>
    </Accordion>
  );
}
