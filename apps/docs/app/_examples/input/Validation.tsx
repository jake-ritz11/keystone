"use client";

import { useState } from "react";
import { Input } from "@keystone-ui/ui";

const TAKEN = ["ada", "admin", "root"];

function check(value: string): string | undefined {
  const name = value.trim().toLowerCase();
  if (name === "") return "Choose a username.";
  if (TAKEN.includes(name)) return "That username is taken.";
  return undefined;
}

export function Validation() {
  const [value, setValue] = useState("ada");
  // Start validated, so the example shows an error straight away.
  const [touched, setTouched] = useState(true);

  return (
    <div className="grid">
      <Input
        label="Username"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        // First check on blur, so it doesn't complain mid-typing; after that, update as they
        // type so the error clears the moment it's fixed. The message takes the hint's line,
        // so none of this moves the fields around it.
        onBlur={() => setTouched(true)}
        hint="Letters and numbers only."
        error={touched ? check(value) : undefined}
      />
      <Input label="Display name" placeholder="Shown on your profile" />
    </div>
  );
}
