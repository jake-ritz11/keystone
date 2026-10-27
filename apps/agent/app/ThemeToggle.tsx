"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@keystone-ui/ui";

type Choice = "system" | "light" | "dark";

const ORDER: Choice[] = ["system", "light", "dark"];
const STORAGE_KEY = "ks-theme";

function apply(choice: Choice): void {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", choice);
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Choice | null;
      if (saved && ORDER.includes(saved)) {
        setChoice(saved);
        apply(saved);
      }
    } catch {
      // Storage can be blocked; the system theme is a fine fallback.
    }
  }, []);

  const next = () => {
    const value = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length] ?? "system";
    const change = () => {
      flushSync(() => setChoice(value));
      apply(value);
    };
    // Cross-fade the whole page between themes, where the browser can, instead of every color
    // snapping at once. The update itself is the same either way.
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reduce) document.startViewTransition(change);
    else change();
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Same as above: the choice still applies for this visit.
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={next} aria-label={`Theme: ${choice}. Change theme`}>
      Theme: {choice}
    </Button>
  );
}
