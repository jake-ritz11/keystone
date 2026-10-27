"use client";

import { useEffect, useState } from "react";
import { Button, CommandMenu, type CommandItem } from "@keystone-ui/ui";

export function Palette() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("Nothing yet");
  const [mac, setMac] = useState(false);

  // The app binds the shortcut; the menu only shows it.
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mod = mac ? "⌘" : "Ctrl";
  const items: CommandItem[] = [
    { id: "new-task", group: "Tasks", label: "New task", shortcut: [mod, "N"], onSelect: () => setLast("New task") },
    { id: "stop", group: "Tasks", label: "Stop the agent", keywords: ["cancel", "halt"], onSelect: () => setLast("Stop the agent") },
    { id: "undo", group: "Tasks", label: "Undo last change", shortcut: [mod, "Z"], onSelect: () => setLast("Undo last change") },
    { id: "theme", group: "View", label: "Toggle theme", keywords: ["dark", "light", "appearance"], onSelect: () => setLast("Toggle theme") },
    { id: "preview", group: "View", label: "Show preview", onSelect: () => setLast("Show preview") },
    { id: "export", group: "View", label: "Export session", disabled: true, onSelect: () => setLast("Export session") },
    { id: "docs", group: "Help", label: "Open the docs", keywords: ["help", "guide"], onSelect: () => setLast("Open the docs") },
  ];

  return (
    <div className="stack">
      <div className="row">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open commands
        </Button>
        <span className="note">or press {mod} K</span>
      </div>
      <CommandMenu open={open} onOpenChange={setOpen} items={items} />
      <p className="note" aria-live="polite">
        Last command: {last}
      </p>
    </div>
  );
}
