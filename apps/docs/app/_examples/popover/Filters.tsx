"use client";

import { useState } from "react";
import { Button, Checkbox, Popover } from "@keystone-ui/ui";

const KINDS = ["Reads", "Edits", "Commands"] as const;

export function Filters() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState<string[]>([...KINDS]);
  const [draft, setDraft] = useState<string[]>(shown);

  return (
    <div className="row" style={{ justifyContent: "space-between", width: "100%" }}>
      <p className="note">Showing: {shown.length ? shown.join(", ") : "nothing"}</p>
      <Popover
        trigger={<Button variant="secondary">Filters</Button>}
        title="Filter the log"
        align="end"
        open={open}
        onOpenChange={(next) => {
          // Each time it opens, start from what's applied, not from an abandoned draft.
          if (next) setDraft(shown);
          setOpen(next);
        }}
      >
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setShown(draft);
            setOpen(false);
          }}
        >
          <fieldset className="plain-fieldset stack">
            <legend className="visually-hidden">Show</legend>
            {KINDS.map((kind) => (
              <Checkbox
                key={kind}
                label={kind}
                checked={draft.includes(kind)}
                onCheckedChange={(on) => setDraft((d) => KINDS.filter((k) => (k === kind ? on : d.includes(k))))}
              />
            ))}
          </fieldset>
          <div>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </Popover>
    </div>
  );
}
