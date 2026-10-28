import type { Metadata } from "next";
import type { ReactNode } from "react";
import { tokenStylesheet } from "@keystone-ui/tokens";
import { ToastProvider } from "@keystone-ui/ui";
import { Hydrated } from "./Hydrated";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keystone Agent",
  description: "Working with a coding agent, built on the Keystone design system.",
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
