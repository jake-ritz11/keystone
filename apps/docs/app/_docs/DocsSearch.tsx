"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommandMenu, type CommandItem } from "@keystone-ui/ui";
import { componentGroups, foundations, writing, type DocLink } from "./registry";

// Words in a summary that would match almost everything, so they are not used as keywords.
const COMMON = new Set(["a", "an", "and", "as", "at", "for", "in", "is", "it", "of", "on", "or", "the", "to", "with", "what", "how"]);

const keywords = (link: DocLink) =>
  link.summary
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !COMMON.has(word));

/**
 * Search across every page of the docs, on the kit's own CommandMenu. The trigger looks like a
 * field so it reads as search, but it is a button: the typing happens in the menu. Ctrl+K (Cmd+K
 * on a Mac) or "/" opens it from anywhere, unless focus is already in a text field.
 */
export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mac, setMac] = useState(false);

  const items = useMemo<CommandItem[]>(() => {
    const go = (link: DocLink, group: string): CommandItem => ({
      id: link.href,
      label: link.title,
      group,
      keywords: keywords(link),
      onSelect: () => router.push(link.href),
    });
    return [
      ...foundations.map((link) => go(link, "Foundations")),
      ...componentGroups.flatMap(({ category, links }) => links.map((link) => go(link, category))),
      ...writing.map((link) => go(link, "Writing")),
    ];
  }, [router]);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']");
      // A demo on the page that binds the same shortcut (the CommandMenu example) marks itself,
      // and gets it; "/" still opens search there.
      const owned = document.querySelector('[data-owns-shortcut="mod+k"]');
      const shortcut = !owned && (event.key === "k" || event.key === "K") && (event.ctrlKey || event.metaKey);
      if (!shortcut && !(event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey)) return;
      event.preventDefault();
      setOpen((o) => (shortcut ? !o : true));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button type="button" className="docs-search" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" strokeLinecap="round" />
        </svg>
        <span className="docs-search-label">Search docs</span>
        <kbd className="docs-search-key" aria-hidden="true">
          {mac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        items={items}
        label="Search docs"
        placeholder="Search components and pages…"
        emptyText="No page matches that."
      />
    </>
  );
}
