import { Checkbox } from "@keystone-ui/ui";

export function States() {
  return (
    <div className="stack">
      <Checkbox label="Send me a summary when a task finishes" hint="One email per task, never more." defaultChecked />
      <Checkbox label="I've read the data policy" required error="Agree to the policy to continue." />
      <Checkbox label="Share sessions with the team" hint="Your workspace admin turned this off." disabled />
    </div>
  );
}
