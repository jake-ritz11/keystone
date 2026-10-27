"use client";

import { useState } from "react";
import { Button, Progress } from "@keystone-ui/ui";

export function Determinate() {
  const [files, setFiles] = useState(3);

  return (
    <div className="stack settings-list">
      <Progress label="Indexing the repository" value={40} />
      <Progress
        label="Uploading files"
        value={files}
        max={12}
        formatValue={(v, max) => `${v} of ${max} files`}
        hint={files === 12 ? "All files uploaded." : "You can keep working while this finishes."}
      />
      <div>
        <Button variant="secondary" size="sm" onClick={() => setFiles((f) => (f >= 12 ? 0 : f + 1))}>
          {files >= 12 ? "Start over" : "Upload another"}
        </Button>
      </div>
    </div>
  );
}
