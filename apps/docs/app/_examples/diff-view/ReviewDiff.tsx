"use client";

import { useState } from "react";
import { diffHunks } from "@keystone-ui/agent-core";
import { Badge, Button, DiffView } from "@keystone-ui/ui";

const BEFORE = `.plans {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}
`;

const AFTER = `.plans-scroll {
  overflow-x: auto;
}

.plans {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
}
`;

export function ReviewDiff() {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  return (
    <DiffView
      path="styles.css"
      hunks={diffHunks(BEFORE, AFTER)}
      actions={
        decision ? (
          <Badge tone={decision === "approved" ? "success" : "danger"} dot>
            {decision === "approved" ? "Approved" : "Rejected"}
          </Badge>
        ) : (
          <>
            <Button size="sm" variant="secondary" onClick={() => setDecision("rejected")}>
              Reject
            </Button>
            <Button size="sm" onClick={() => setDecision("approved")}>
              Approve
            </Button>
          </>
        )
      }
    />
  );
}
