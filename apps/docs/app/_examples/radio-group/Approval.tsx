"use client";

import { useState } from "react";
import { RadioGroup } from "@keystone-ui/ui";

type Mode = "each" | "end" | "auto";

export function Approval() {
  const [mode, setMode] = useState<Mode>("each");

  return (
    <div className="stack">
      <RadioGroup<Mode>
        label="When should edits need you?"
        value={mode}
        onValueChange={setMode}
        options={[
          { value: "each", label: "Approve each edit", hint: "Every change waits, as a diff." },
          { value: "end", label: "Review at the end", hint: "Edits apply as the agent works; review them all together." },
          { value: "auto", label: "Apply automatically", hint: "Undo any edit, any time." },
        ]}
      />
      <p className="note">Selected: {mode}</p>
    </div>
  );
}
