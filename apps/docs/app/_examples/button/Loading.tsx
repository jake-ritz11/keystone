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
      {/* Keep the label the same while loading: changing it would change the width. */}
      <Button loading={saving} onClick={save}>
        Save changes
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
