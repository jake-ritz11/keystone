import { Badge } from "@keystone-ui/ui";

export function Badges() {
  return (
    <div className="stack">
      <div className="row">
        <Badge>Draft</Badge>
        <Badge tone="accent">Beta</Badge>
        <Badge tone="success">Published</Badge>
        <Badge tone="danger">Failed</Badge>
      </div>
      <div className="row">
        <Badge dot>Waiting</Badge>
        <Badge tone="accent" dot>
          Running
        </Badge>
        <Badge tone="success" dot>
          Applied
        </Badge>
        <Badge tone="danger" dot>
          Rejected
        </Badge>
      </div>
    </div>
  );
}
