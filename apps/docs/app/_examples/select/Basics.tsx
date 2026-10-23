import { Select } from "@keystone-ui/ui";

export function Basics() {
  return (
    <div className="grid">
      <Select label="Region" defaultValue="eu">
        <option value="eu">Europe</option>
        <option value="us">United States</option>
        <option value="ap">Asia Pacific</option>
      </Select>
      <Select label="Plan" placeholder="Choose a plan" hint="You can change this later." required>
        <option value="free">Free</option>
        <option value="team">Team</option>
        <option value="enterprise" disabled>
          Enterprise (contact us)
        </option>
      </Select>
    </div>
  );
}
