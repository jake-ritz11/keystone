"use client";

import { useState } from "react";
import { Button, Dialog } from "@keystone-ui/ui";

export function SmallDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Small, no footer
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title="Keyboard shortcuts"
        description="Press Escape or click outside to close."
      >
        <p>Close with the corner button, Escape, or a click on the backdrop.</p>
      </Dialog>
    </>
  );
}
