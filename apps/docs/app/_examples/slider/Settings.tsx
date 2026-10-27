"use client";

import { useState } from "react";
import { Slider } from "@keystone-ui/ui";

export function Settings() {
  const [steps, setSteps] = useState(8);

  return (
    <div className="stack settings-list">
      <Slider
        label="Steps before checking in"
        min={1}
        max={20}
        value={steps}
        onValueChange={setSteps}
        formatValue={(v) => (v === 1 ? "1 step" : `${v} steps`)}
        hint={steps <= 3 ? "The agent will stop often to ask." : "The agent works longer on its own between check-ins."}
      />
      <Slider label="Lines of context in diffs" min={0} max={10} defaultValue={3} />
      <Slider
        label="Creativity"
        min={0}
        max={1}
        step={0.1}
        defaultValue={0.3}
        formatValue={(v) => (v < 0.4 ? `${v.toFixed(1)}, focused` : v < 0.7 ? `${v.toFixed(1)}, balanced` : `${v.toFixed(1)}, varied`)}
      />
    </div>
  );
}
