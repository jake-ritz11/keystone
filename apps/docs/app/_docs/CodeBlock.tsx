"use client";

import { Button, useToast } from "@keystone-ui/ui";

export function CodeBlock({ code, label }: { code: string; label: string }) {
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Copied to clipboard", tone: "success", duration: 2500 });
    } catch {
      toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access.", tone: "danger" });
    }
  };

  return (
    <div className="code">
      {/* Secondary, not ghost: it has its own surface, so code scrolled beneath it never shows through. */}
      <Button variant="secondary" size="sm" className="code-copy" onClick={copy}>
        Copy<span className="visually-hidden"> {label} code</span>
      </Button>
      {/* Focusable so keyboard users can scroll long lines sideways. */}
      <pre tabIndex={0} aria-label={`${label} source`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
