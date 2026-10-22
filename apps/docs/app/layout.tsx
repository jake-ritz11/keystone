import type { Metadata } from "next";
import type { ReactNode } from "react";
import { tokenStylesheet } from "@keystone-ui/tokens";
import { ToastProvider } from "@keystone-ui/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keystone",
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
