"use client";

import { Button, useToast } from "@keystone-ui/ui";

export function ActionAndPersistent() {
  const { toast } = useToast();

  return (
    <div className="row">
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            title: "3 files moved to trash",
            // Toasts time out, so Undo must also exist somewhere permanent, like the trash view.
            action: { label: "Undo", onClick: () => toast({ title: "Files restored", tone: "success" }) },
          })
        }
      >
        With action
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: "Stays until closed", duration: Infinity })}>
        Persistent
      </Button>
    </div>
  );
}
