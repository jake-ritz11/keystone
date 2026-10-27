"use client";

import { useState } from "react";
import { Button } from "@keystone-ui/ui";

/** Runs a dot across a track with each duration and easing token. */
export function MotionDemo({ rows }: { rows: { label: string; duration: string; easing: string }[] }) {
  const [moved, setMoved] = useState(false);

  return (
    <div className="motion">
      <Button variant="secondary" size="sm" onClick={() => setMoved((m) => !m)} aria-pressed={moved}>
        {moved ? "Reset" : "Play"}
      </Button>
      <p className="note">With reduced motion on, the dots jump instead of gliding.</p>
      <ul className="motion-list">
        {rows.map((row) => (
          <li key={row.label} className="motion-row">
            <code>{row.label}</code>
            <div className="motion-track">
              <span
                className="motion-dot"
                data-moved={moved || undefined}
                style={{ transitionDuration: `var(${row.duration})`, transitionTimingFunction: `var(${row.easing})` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
