"use client";

import { useState } from "react";
import { Button, Menu, MenuItem, MenuSeparator } from "@keystone-ui/ui";

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ActionsMenu() {
  const [last, setLast] = useState("Nothing yet");

  return (
    <div className="stack">
      <div className="row">
        <Menu trigger={<Button variant="secondary">Actions</Button>}>
          <MenuItem iconStart={<Icon d="M3 11.5V13h1.5l7-7L10 4.5l-7 7Z" />} shortcut="Ctrl E" onClick={() => setLast("Rename")}>
            Rename
          </MenuItem>
          <MenuItem iconStart={<Icon d="M5 5h8v8H5zM3 11V3h8" />} shortcut="Ctrl D" onClick={() => setLast("Duplicate")}>
            Duplicate
          </MenuItem>
          <MenuItem iconStart={<Icon d="M8 3v7m0 0 3-3m-3 3L5 7M3 13h10" />} onClick={() => setLast("Download")}>
            Download
          </MenuItem>
          <MenuItem iconStart={<Icon d="M4 8h8" />} disabled>
            Archive (no permission)
          </MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger" iconStart={<Icon d="M3 4h10M6 4V3h4v1m-5 0 .5 9h5L11 4" />} onClick={() => setLast("Delete")}>
            Delete
          </MenuItem>
        </Menu>
      </div>
      <p className="note" aria-live="polite">
        Last action: {last}
      </p>
    </div>
  );
}
