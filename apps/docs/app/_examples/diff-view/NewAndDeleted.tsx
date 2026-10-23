import { diffHunks } from "@keystone-ui/agent-core";
import { DiffView } from "@keystone-ui/ui";

export function NewAndDeleted() {
  return (
    <div className="stack">
      <DiffView path="about.html" hunks={diffHunks(null, "<h1>About</h1>\n<p>We're three people.</p>\n")} />
      <DiffView path="old-banner.css" hunks={diffHunks(".banner {\n  display: none;\n}\n", null)} />
    </div>
  );
}
