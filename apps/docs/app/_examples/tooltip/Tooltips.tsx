import { Button, Tooltip } from "@keystone-ui/ui";

export function Tooltips() {
  return (
    <div className="row">
      <Tooltip content="Saves a copy to your workspace">
        <Button variant="secondary">Hover or focus me</Button>
      </Tooltip>
      <Tooltip content="Opens below, and flips if there is no room" side="bottom">
        <Button variant="ghost">Bottom</Button>
      </Tooltip>
      <Tooltip content="No delay on this one" delay={0}>
        <Button variant="ghost">Instant</Button>
      </Tooltip>
    </div>
  );
}
