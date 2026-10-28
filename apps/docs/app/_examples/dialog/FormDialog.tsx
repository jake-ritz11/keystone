"use client";

import { useState } from "react";
import { Button, Dialog, Input } from "@keystone-ui/ui";

export function FormDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Edit profile
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit profile"
        description="Changes are visible to everyone in your workspace."
        // It holds input, so a stray click outside shouldn't throw it away.
        dismissible={false}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <div className="stack">
          <Input label="Name" defaultValue="Ada Lovelace" hint="As it appears on your comments and edits." autoFocus />
          <Input label="Role" defaultValue="Analyst" hint="Shown next to your name." />
        </div>
      </Dialog>
    </>
  );
}
