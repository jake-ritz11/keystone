import { Select } from "@keystone-ui/ui";

export function GroupsAndErrors() {
  return (
    <div className="grid">
      <Select label="Time zone" placeholder="Select a time zone" error="Pick a time zone to continue.">
        <optgroup label="Europe">
          <option value="lon">London</option>
          <option value="ber">Berlin</option>
        </optgroup>
        <optgroup label="Americas">
          <option value="nyc">New York</option>
          <option value="sfo">San Francisco</option>
        </optgroup>
      </Select>
      <Select label="Disabled" disabled defaultValue="us">
        <option value="us">United States</option>
      </Select>
    </div>
  );
}
