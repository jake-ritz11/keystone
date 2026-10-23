import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { tokenStylesheet } from "@keystone-ui/tokens";
import { ToastProvider } from "@keystone-ui/ui";
import { ThemeToggle } from "./ThemeToggle";
import { Hydrated } from "./_docs/Hydrated";
import { SiteNav } from "./_docs/SiteNav";
import { REPO } from "./_docs/registry";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Keystone", template: "%s · Keystone" },
  description: "A token-driven React design system with Claude-powered generate and audit tools.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: ThemeToggle sets data-theme on <html> on the client.
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokenStylesheet() }} />
      </head>
      <body>
        <Hydrated />
        <ToastProvider>
          <a className="skip-link" href="#content">
            Skip to content
          </a>
          <header className="site-header">
            <Link href="/" className="site-title">
              Keystone
            </Link>
            <div className="site-actions">
              <a className="site-link" href={REPO}>
                GitHub
              </a>
              <ThemeToggle />
            </div>
          </header>
          <div className="site-body">
            <SiteNav />
            <main id="content" tabIndex={-1}>
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
