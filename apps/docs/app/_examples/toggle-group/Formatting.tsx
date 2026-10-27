"use client";

import { useState } from "react";
import { ToggleGroup } from "@keystone-ui/ui";

type Style = "bold" | "italic" | "code";

const icon = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Formatting() {
  const [styles, setStyles] = useState<Style[]>(["bold"]);

  return (
    <div className="stack">
      <ToggleGroup<Style>
        aria-label="Text style"
        multiple
        iconOnly
        value={styles}
        onValueChange={setStyles}
        options={[
          { value: "bold", label: "Bold", icon: icon("M4.5 3h4a2.5 2.5 0 0 1 0 5h-4zm0 5h4.5a2.5 2.5 0 0 1 0 5H4.5z") },
          { value: "italic", label: "Italic", icon: icon("M7 3h5M4 13h5M9.5 3l-3 10") },
          { value: "code", label: "Code", icon: icon("M5.5 4.5 2 8l3.5 3.5m5-7L14 8l-3.5 3.5") },
        ]}
      />
      <p className="note">Pressed: {styles.length ? styles.join(", ") : "none"}</p>
    </div>
  );
}
