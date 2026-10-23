import { Input } from "@keystone-ui/ui";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" strokeLinecap="round" />
  </svg>
);

export function IconsAndSizes() {
  return (
    <div className="stack">
      <Input
        label="Search"
        hideLabel
        type="search"
        placeholder="Search components"
        iconStart={<SearchIcon />}
        reserveMessageSpace={false}
      />
      <div className="row">
        <Input label="Small" size="sm" placeholder="sm" />
        <Input label="Medium" size="md" placeholder="md" />
        <Input label="Large" size="lg" placeholder="lg" />
      </div>
    </div>
  );
}
