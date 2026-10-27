"use client";

import { Slider } from "@keystone-ui/ui";

export function States() {
  return (
    <div className="stack settings-list">
      <Slider label="Parallel agents" min={1} max={4} defaultValue={2} hint="Your plan allows up to 4." disabled />
      <Slider label="Preview zoom" hideLabel min={50} max={200} step={10} defaultValue={100} formatValue={(v) => `${v}%`} />
    </div>
  );
}
