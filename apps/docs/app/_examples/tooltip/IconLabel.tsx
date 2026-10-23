import { Button, Tooltip } from "@keystone-ui/ui";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" strokeLinecap="round" />
  </svg>
);

export function IconLabel() {
  return (
    <div className="row">
      {/* The button has no text, so the tooltip is its accessible name. */}
      <Tooltip content="Search" kind="label">
        <Button variant="secondary">
          <SearchIcon />
        </Button>
      </Tooltip>
    </div>
  );
}
