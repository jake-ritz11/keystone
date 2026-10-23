import { Button } from "@keystone-ui/ui";

export function Variants() {
  return (
    <div className="row">
      <Button>Save changes</Button>
      <Button variant="secondary">Preview</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="danger">Delete</Button>
    </div>
  );
}
