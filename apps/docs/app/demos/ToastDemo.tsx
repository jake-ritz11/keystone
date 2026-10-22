"use client";

import { useState } from "react";
import { Button, Dialog, useToast } from "@keystone-ui/ui";

export function ToastDemo() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="row">
        <Button variant="secondary" onClick={() => toast({ title: "Draft saved" })}>
          Neutral
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast({ title: "Project published", description: "It's live for everyone in the workspace.", tone: "success" })
          }
        >
          Success
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast({ title: "Couldn't upload file", description: "Check your connection and try again.", tone: "danger" })
          }
        >
          Danger
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast({
              title: "3 files moved to trash",
              action: { label: "Undo", onClick: () => toast({ title: "Files restored", tone: "success" }) },
            })
          }
        >
          With action
        </Button>
        <Button variant="secondary" onClick={() => toast({ title: "Stays until closed", duration: Infinity })}>
          Persistent
        </Button>
        <Button variant="ghost" onClick={() => setDialogOpen(true)}>
          From a dialog
        </Button>
      </div>
      <p className="note">Hover or focus the stack to pause the timers.</p>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        size="sm"
        title="Toasts above a modal"
        description="The stack re-enters the top layer, so it shows over this dialog."
        footer={<Button onClick={() => toast({ title: "Shown above the dialog", tone: "success" })}>Show toast</Button>}
      />
    </>
  );
}
