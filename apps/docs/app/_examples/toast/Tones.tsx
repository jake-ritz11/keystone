"use client";

import { Button, useToast } from "@keystone-ui/ui";

export function Tones() {
  const { toast } = useToast();

  return (
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
    </div>
  );
}
