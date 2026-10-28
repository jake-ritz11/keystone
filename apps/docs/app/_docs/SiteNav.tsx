"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DocsSearch } from "./DocsSearch";
import { componentGroups, components, foundations, writing, type DocLink } from "./registry";

function Links({ links, pathname }: { links: DocLink[]; pathname: string }) {
  return (
    <ul className="nav-list">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="nav-link" aria-current={pathname === link.href ? "page" : undefined}>
            {link.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * A collapsible group, on the native details element. It opens when it holds the current page,
 * and otherwise stays as the reader left it, so the sidebar shows one group's links at a time
 * instead of all 37.
 */
function Collapsible({ label, links, pathname, level }: { label: string; links: DocLink[]; pathname: string; level: "group" | "category" }) {
  const here = links.some((link) => link.href === pathname);
  return (
    <details className={`nav-collapsible nav-${level}`} open={here || undefined}>
      <summary>
        <span>{label}</span>
        {/* A visual hint of the group's size; the list itself says how many there are. */}
        <span className="nav-count" aria-hidden="true">
          {links.length}
        </span>
      </summary>
      <Links links={links} pathname={pathname} />
    </details>
  );
}

/**
 * The docs' navigation: search at the top, then the pages in groups, with the components split
 * into categories that collapse. On a wide screen it is a sidebar. On a phone the groups sit
 * behind a Menu button, and search stays visible above it.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = [...foundations, ...components, ...writing].find((link) => link.href === pathname);

  const toggle = useRef<HTMLButtonElement>(null);

  // Choosing a page closes the menu.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes it from anywhere: Safari doesn't focus a button that's clicked, so focus may
  // not be inside the nav when the key is pressed.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="site-nav" aria-label="Docs" data-open={open || undefined}>
      <div className="nav-search">
        <DocsSearch />
      </div>
      <button ref={toggle} type="button" className="nav-toggle" aria-expanded={open} aria-controls="docs-nav-groups" onClick={() => setOpen(!open)}>
        <span>Menu</span>
        {current && <span className="nav-toggle-current">{current.title}</span>}
        <svg className="nav-toggle-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id="docs-nav-groups" className="nav-groups">
        <div className="nav-group">
          <h2 className="nav-label">Foundations</h2>
          <Links links={foundations} pathname={pathname} />
        </div>
        <div className="nav-group">
          <h2 className="nav-label">Components</h2>
          {componentGroups.map(({ category, links }) => (
            <Collapsible key={category} label={category} links={links} pathname={pathname} level="category" />
          ))}
        </div>
        <div className="nav-group">
          <Collapsible label="Writing" links={writing} pathname={pathname} level="group" />
        </div>
      </div>
    </nav>
  );
}
