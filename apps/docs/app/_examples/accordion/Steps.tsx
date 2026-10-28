"use client";

import { useState } from "react";
import { Accordion, AccordionItem, Badge, Button } from "@keystone-ui/ui";

const STEPS = [
  { value: "read", title: "Read the pricing page", status: <Badge tone="success">Done</Badge>, detail: "Found the three plan cards and the table under them." },
  { value: "edit", title: "Fix the table overflow", status: <Badge tone="success">Done</Badge>, detail: "Wrapped the table in a scroll container with a visible edge." },
  { value: "check", title: "Check it at phone width", status: <Badge>Running</Badge>, detail: "Loading the page at 375 pixels wide." },
];

export function Steps() {
  const [open, setOpen] = useState<string[]>(["check"]);
  const all = open.length === STEPS.length;

  return (
    <div className="stack">
      <div>
        <Button variant="secondary" size="sm" onClick={() => setOpen(all ? [] : STEPS.map((s) => s.value))}>
          {all ? "Collapse all" : "Expand all"}
        </Button>
      </div>
      <Accordion multiple headingLevel={4} value={open} onValueChange={setOpen}>
        {STEPS.map((step) => (
          <AccordionItem key={step.value} value={step.value} title={step.title} meta={step.status}>
            <p className="disclosure-answer">{step.detail}</p>
          </AccordionItem>
        ))}
        <AccordionItem value="deploy" title="Deploy the preview" meta={<Badge>Waiting</Badge>} disabled>
          <p className="disclosure-answer">Starts after the check.</p>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
