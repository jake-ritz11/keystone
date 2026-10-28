import { Select } from "@keystone-ui/ui";

export function Sizes() {
  return (
    <div className="row top">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select key={size} label={size.toUpperCase()} size={size} defaultValue="eu">
          <option value="eu">Europe</option>
          <option value="us">United States</option>
        </Select>
      ))}
    </div>
  );
}
