"use client";

import { useState } from "react";
import { Button } from "@keystone-ui/ui";

export function Loading() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="row">
      <Button loading={saving} onClick={save}>
        {saving ? "Saving" : "Save"}
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
