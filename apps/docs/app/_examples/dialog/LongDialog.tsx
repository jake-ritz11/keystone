"use client";

import { useState } from "react";
import { Button, Dialog } from "@keystone-ui/ui";

export function LongDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Long content
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="Release notes"
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <p key={i}>
            Section {i + 1}. The body scrolls on its own while the title and the actions stay in
            place, so the primary action is always reachable without scrolling back.
          </p>
        ))}
      </Dialog>
    </>
  );
}
