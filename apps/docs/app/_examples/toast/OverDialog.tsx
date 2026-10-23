"use client";

import { useState } from "react";
import { Button, Dialog, useToast } from "@keystone-ui/ui";

export function OverDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        From a dialog
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title="Toasts above a modal"
        description="The toast layer moves into the open dialog, so it stays clickable and is still announced."
        footer={<Button onClick={() => toast({ title: "Shown above the dialog", tone: "success" })}>Show toast</Button>}
      />
    </>
  );
}
