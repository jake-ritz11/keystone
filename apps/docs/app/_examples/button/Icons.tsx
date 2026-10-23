import { Button } from "@keystone-ui/ui";

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
  </svg>
);

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3 8h10m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Icons() {
  return (
    <div className="row">
      <Button iconStart={<Plus />}>New project</Button>
      <Button variant="secondary" iconEnd={<Arrow />}>
        Continue
      </Button>
    </div>
  );
}
