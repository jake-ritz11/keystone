"use client";

import { useState, type FormEvent } from "react";
import { Button, RadioGroup } from "@keystone-ui/ui";

export function Required() {
  const [error, setError] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
  };

  return (
    <form className="stack" onSubmit={submit} onInvalid={() => setError("Choose a size to continue.")}>
      <RadioGroup
        label="Preview size"
        name="size"
        required
        orientation="horizontal"
        error={error}
        onValueChange={() => setError(undefined)}
        options={[
          { value: "phone", label: "Phone" },
          { value: "tablet", label: "Tablet" },
          { value: "desktop", label: "Desktop" },
          { value: "wide", label: "Wide", disabled: true },
        ]}
      />
      <div>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
