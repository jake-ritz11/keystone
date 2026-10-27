"use client";

import { useState } from "react";
import { Checkbox } from "@keystone-ui/ui";

const FILES = ["index.html", "styles.css", "README.md"];

export function SelectAll() {
  const [picked, setPicked] = useState<string[]>(["styles.css"]);
  const all = picked.length === FILES.length;

  return (
    <fieldset className="stack plain-fieldset">
      <legend className="visually-hidden">Files to include</legend>
      <Checkbox
        label="All files"
        checked={all}
        indeterminate={picked.length > 0 && !all}
        onCheckedChange={(checked) => setPicked(checked ? FILES : [])}
      />
      <div className="stack indent">
        {FILES.map((file) => (
          <Checkbox
            key={file}
            label={file}
            checked={picked.includes(file)}
            onCheckedChange={(checked) => setPicked((p) => (checked ? [...p, file] : p.filter((f) => f !== file)))}
          />
        ))}
      </div>
    </fieldset>
  );
}
