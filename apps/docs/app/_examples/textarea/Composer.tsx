"use client";

import { useState } from "react";
import { Button, Textarea } from "@keystone-ui/ui";

export function Composer() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string[]>([]);

  const send = () => {
    if (!text.trim()) return;
    setSent((all) => [...all, text.trim()]);
    setText("");
  };

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <Textarea
        label="Message"
        hideLabel
        placeholder="Ask for a change…"
        hint="Enter to send, Shift+Enter for a new line."
        minRows={2}
        maxRows={8}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter, or Enter while an IME is composing, adds a line.
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            send();
          }
        }}
      />
      <div className="row">
        <Button type="submit" disabled={!text.trim()}>
          Send
        </Button>
        <span className="note" aria-live="polite">
          {sent.length ? `Sent ${sent.length} message${sent.length === 1 ? "" : "s"}.` : ""}
        </span>
      </div>
    </form>
  );
}
