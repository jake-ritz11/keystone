import { Textarea } from "@keystone-ui/ui";

export function States() {
  return (
    <div className="grid">
      <Textarea label="Release notes" defaultValue="Fixed the broken About link." hint="Shown on the changelog page." />
      <Textarea label="Summary" error="Add a summary before publishing." />
      <Textarea label="Fixed height" autoResize={false} minRows={3} defaultValue={"Doesn't grow.\nScrolls instead,\nand can be resized by hand.\nLine four."} />
      <Textarea label="Disabled" disabled defaultValue="Not editable" />
    </div>
  );
}
