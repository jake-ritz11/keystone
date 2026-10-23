"use client";

import { useState } from "react";
import { Button, Menu, MenuItem } from "@keystone-ui/ui";

const SORTS = { newest: "Newest first", oldest: "Oldest first", name: "Name" } as const;
type Sort = keyof typeof SORTS;

export function SortMenu() {
  const [sort, setSort] = useState<Sort>("newest");

  return (
    <div className="row">
      <Menu align="end" trigger={<Button variant="ghost">Sort: {SORTS[sort]}</Button>}>
        {(Object.keys(SORTS) as Sort[]).map((key) => (
          <MenuItem key={key} onClick={() => setSort(key)}>
            {SORTS[key]}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
