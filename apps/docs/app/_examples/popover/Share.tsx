"use client";

import { Button, Input, Popover, Switch } from "@keystone-ui/ui";

export function Share() {
  return (
    <Popover trigger={<Button variant="secondary">Share</Button>} title="Share this session">
      <div className="stack">
        <Input label="Link" defaultValue="https://example.com/s/7f3a" readOnly reserveMessageSpace={false} />
        <Switch label="Anyone with the link can view" defaultChecked />
        <div>
          <Button size="sm">Copy link</Button>
        </div>
      </div>
    </Popover>
  );
}
