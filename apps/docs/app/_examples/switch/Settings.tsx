"use client";

import { useState } from "react";
import { Switch } from "@keystone-ui/ui";

export function Settings() {
  const [autoApply, setAutoApply] = useState(false);

  return (
    <div className="stack settings-list">
      <Switch
        label="Apply edits automatically"
        hint={autoApply ? "Edits apply as the agent makes them. Undo is always there." : "Each edit waits for your approval."}
        checked={autoApply}
        onCheckedChange={setAutoApply}
      />
      <Switch label="Show the agent's reads and searches" defaultChecked />
      <Switch label="Live sessions" hint="Needs an API key on the server." disabled />
    </div>
  );
}
