"use client";

import { useState } from "react";
import { SegmentedControl } from "@keystone-ui/ui";

export function Segmented() {
  const [width, setWidth] = useState<"desktop" | "tablet" | "phone">("desktop");

  return (
    <div className="stack">
      <SegmentedControl
        aria-label="Preview width"
        value={width}
        onValueChange={setWidth}
        options={[
          { value: "desktop", label: "Desktop" },
          { value: "tablet", label: "Tablet" },
          { value: "phone", label: "Phone" },
        ]}
      />
      <p className="note">Previewing at {width} width.</p>
      <SegmentedControl
        aria-label="Mode"
        size="sm"
        defaultValue="replay"
        options={[
          { value: "replay", label: "Replay" },
          { value: "live", label: "Live", disabled: true },
        ]}
      />
    </div>
  );
}
