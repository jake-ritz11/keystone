import { Input } from "@keystone-ui/ui";

export function States() {
  return (
    <div className="grid">
      <Input label="Workspace ID" defaultValue="ks-0042" readOnly hint="Read-only: focusable and copyable." />
      <Input label="Disabled" placeholder="Not editable" disabled />
    </div>
  );
}
