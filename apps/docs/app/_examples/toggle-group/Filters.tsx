"use client";

import { ToggleGroup } from "@keystone-ui/ui";

export function Filters() {
  return (
    <div className="stack">
      <ToggleGroup
        aria-label="Show in the activity log"
        multiple
        defaultValue={["edits", "commands"]}
        options={[
          { value: "reads", label: "Reads" },
          { value: "searches", label: "Searches" },
          { value: "edits", label: "Edits" },
          { value: "commands", label: "Commands" },
          { value: "network", label: "Network", disabled: true },
        ]}
      />
      <ToggleGroup
        aria-label="Only show"
        size="sm"
        options={[
          { value: "errors", label: "Errors" },
          { value: "warnings", label: "Warnings" },
          { value: "notes", label: "Notes" },
        ]}
      />
    </div>
  );
}
