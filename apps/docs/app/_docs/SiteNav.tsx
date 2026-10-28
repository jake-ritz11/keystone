"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { components, foundations, writing, type DocLink } from "./registry";

function Group({ label, links, pathname }: { label: string; links: DocLink[]; pathname: string }) {
  return (
    <div className="nav-group">
      <h2 className="nav-label">{label}</h2>
      <ul className="nav-list">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="nav-link" aria-current={pathname === link.href ? "page" : undefined}>
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The docs' navigation. On a wide screen it's a sidebar. On a phone it's behind a Menu button
 * that opens the same grouped list, rather than a row of 30 links scrolling sideways, most of
 * them offscreen. The button only shows on a phone, so the sidebar never collapses.
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
      <button ref={toggle} type="button" className="nav-toggle" aria-expanded={open} aria-controls="docs-nav-groups" onClick={() => setOpen(!open)}>
        <span>Menu</span>
        {current && <span className="nav-toggle-current">{current.title}</span>}
        <svg className="nav-toggle-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id="docs-nav-groups" className="nav-groups">
        <Group label="Foundations" links={foundations} pathname={pathname} />
        <Group label="Components" links={components} pathname={pathname} />
        <Group label="Writing" links={writing} pathname={pathname} />
      </div>
    </nav>
  );
}
