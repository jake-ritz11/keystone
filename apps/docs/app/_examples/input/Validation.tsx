"use client";

import { useState } from "react";
import { Input } from "@keystone-ui/ui";

const TAKEN = ["ada", "admin", "root"];

export function Validation() {
  const [value, setValue] = useState("ada");
  const [touched, setTouched] = useState(true);

  const error = !touched
    ? undefined
    : value.trim() === ""
      ? "Choose a username."
      : TAKEN.includes(value.trim().toLowerCase())
        ? "That username is taken."
        : undefined;

  return (
    <div className="grid">
      <Input
        label="Username"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        // Validate on blur, not on every keystroke, so the error doesn't shout while typing.
        onFocus={() => setTouched(false)}
        onBlur={() => setTouched(true)}
        hint="Letters and numbers only."
        error={error}
      />
    </div>
  );
}
