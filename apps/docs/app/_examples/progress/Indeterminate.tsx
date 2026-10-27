import { Progress } from "@keystone-ui/ui";

export function Indeterminate() {
  return (
    <div className="stack settings-list">
      <Progress label="Waiting for the model" hint="Usually under ten seconds." />
    </div>
  );
}
