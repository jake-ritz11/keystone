"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { components, foundations, type DocLink } from "./registry";

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

export function SiteNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // On phones the nav is one scrolling row; bring the current page's link into view.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav ref={navRef} className="site-nav" aria-label="Docs">
      <Group label="Foundations" links={foundations} pathname={pathname} />
      <Group label="Components" links={components} pathname={pathname} />
    </nav>
  );
}
