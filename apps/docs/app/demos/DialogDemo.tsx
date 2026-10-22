"use client";

import { useState } from "react";
import { Button, Dialog, Input } from "@keystone-ui/ui";

export function DialogDemo() {
  const [open, setOpen] = useState<null | "form" | "confirm" | "long" | "small">(null);
  const close = () => setOpen(null);
  const onOpenChange = (next: boolean) => {
    if (!next) close();
  };

  return (
    <>
      <div className="row">
        <Button variant="secondary" onClick={() => setOpen("form")}>
          Edit profile
        </Button>
        <Button variant="danger" onClick={() => setOpen("confirm")}>
          Delete project
        </Button>
        <Button variant="secondary" onClick={() => setOpen("long")}>
          Long content
        </Button>
        <Button variant="secondary" onClick={() => setOpen("small")}>
          Small, no footer
        </Button>
      </div>

      <Dialog
        open={open === "form"}
        onOpenChange={onOpenChange}
        title="Edit profile"
        description="Changes are visible to everyone in your workspace."
        dismissible={false}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={close}>Save</Button>
          </>
        }
      >
        <div className="stack">
          <Input label="Name" defaultValue="Ada Lovelace" autoFocus />
          <Input label="Role" defaultValue="Analyst" hint="Shown next to your name." />
        </div>
      </Dialog>

      <Dialog
        open={open === "confirm"}
        onOpenChange={onOpenChange}
        role="alertdialog"
        size="sm"
        title="Delete this project?"
        description="All 24 files and their history will be removed. This can't be undone."
        hideCloseButton
        dismissible={false}
        footer={
          <>
            <Button variant="secondary" onClick={close} autoFocus>
              Keep project
            </Button>
            <Button variant="danger" onClick={close}>
              Delete
            </Button>
          </>
        }
      />

      <Dialog
        open={open === "long"}
        onOpenChange={onOpenChange}
        size="lg"
        title="Release notes"
        footer={<Button onClick={close}>Done</Button>}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i}>
            Section {i + 1}. The body scrolls on its own while the title and the actions stay in
            place, so the primary action is always reachable without scrolling back.
          </p>
        ))}
      </Dialog>

      <Dialog
        open={open === "small"}
        onOpenChange={onOpenChange}
        size="sm"
        title="Keyboard shortcuts"
        description="Press Escape or click outside to close."
      >
        <p>Close with the corner button, Escape, or a click on the backdrop.</p>
      </Dialog>
    </>
  );
}
