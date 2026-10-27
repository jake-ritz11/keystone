"use client";

import { useState } from "react";
import { Badge, Button, Shimmer } from "@keystone-ui/ui";

export function Progress() {
  const [done, setDone] = useState(false);
  return (
    <div className="stack">
      <p>
        <Shimmer active={!done}>{done ? "Thought for 4 seconds" : "Thinking…"}</Shimmer>
      </p>
      <p className="row">
        <Shimmer active={!done}>Reading index.html</Shimmer>
        <Badge tone={done ? "success" : "accent"} dot pulse={!done}>
          {done ? "Done" : "Running"}
        </Badge>
      </p>
      <div>
        <Button variant="secondary" size="sm" onClick={() => setDone((d) => !d)}>
          {done ? "Start again" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
