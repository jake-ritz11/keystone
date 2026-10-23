import { Badge, Disclosure } from "@keystone-ui/ui";

export function Disclosures() {
  return (
    <div className="stack">
      <Disclosure summary="Read styles.css" meta={<Badge tone="success">Done</Badge>}>
        <pre className="disclosure-output">{`.plans {\n  width: 100%;\n  min-width: 720px;\n}`}</pre>
      </Disclosure>
      <Disclosure summary="Search for “abuot” in all files" meta={<Badge tone="danger">Failed</Badge>} defaultOpen>
        <p className="disclosure-text">No matches for “abuot”. Closed content is still found by the browser&apos;s find-in-page, which opens it.</p>
      </Disclosure>
    </div>
  );
}
