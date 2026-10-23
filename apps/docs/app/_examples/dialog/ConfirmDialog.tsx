"use client";

import { useState } from "react";
import { Button, Dialog } from "@keystone-ui/ui";

export function ConfirmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete project
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        role="alertdialog"
        size="sm"
        title="Delete this project?"
        description="All 24 files and their history will be removed. This can't be undone."
        hideCloseButton
        dismissible={false}
        footer={
          <>
            {/* Focus starts on the safe choice. */}
            <Button variant="secondary" onClick={() => setOpen(false)} autoFocus>
              Keep project
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}
