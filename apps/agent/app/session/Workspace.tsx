"use client";

import { useMemo, useState } from "react";
import { diffHunks, paths, type Workspace } from "@keystone-ui/agent-core";
import { Badge, DiffView, Select, Tab, TabList, TabPanel, Tabs } from "@keystone-ui/ui";
import styles from "./session.module.css";

/** Inlines a page's linked stylesheets, so it renders from the in-memory workspace. */
function pageDocument(workspace: Workspace, page: string): string {
  const html = workspace[page] ?? "<p>This page doesn't exist.</p>";
  return html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g, (tag, href: string) => {
    const css = workspace[href.replace(/^\.?\//, "")];
    return css === undefined ? tag : `<style>\n${css}\n</style>`;
  });
}

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className={styles.toggle} role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" className={styles.toggleButton} aria-pressed={value === v} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Preview({ workspace, baseline }: { workspace: Workspace; baseline: Workspace }) {
  const pages = paths(workspace).filter((p) => p.endsWith(".html"));
  // Open on the home page; the list itself is alphabetical.
  const [page, setPage] = useState(pages.includes("index.html") ? "index.html" : (pages[0] ?? "index.html"));
  const [side, setSide] = useState<"after" | "before">("after");
  const [width, setWidth] = useState<"desktop" | "phone">("desktop");
  const source = side === "after" ? workspace : baseline;
  const doc = useMemo(() => pageDocument(source, page), [source, page]);

  return (
    <div className={styles.preview}>
      <div className={styles.previewBar}>
        <Select label="Page" hideLabel size="sm" value={page} onChange={(e) => setPage(e.target.value)} reserveMessageSpace={false}>
          {pages.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Toggle label="Version" value={side} options={[["after", "Now"], ["before", "Before"]]} onChange={setSide} />
        <Toggle label="Width" value={width} options={[["desktop", "Desktop"], ["phone", "Phone"]]} onChange={setWidth} />
      </div>
      <div className={styles.frameWrap} data-width={width}>
        {/* No scripts, no same-origin: the agent's HTML can render but can't do anything. */}
        <iframe className={styles.frame} title={`Preview of ${page}`} sandbox="" srcDoc={doc} />
      </div>
    </div>
  );
}

/** The site the agent is editing: a live preview, the changes so far, and the raw files. */
export function WorkspacePane({ workspace, baseline }: { workspace: Workspace; baseline: Workspace }) {
  const changed = useMemo(
    () => [...new Set([...paths(workspace), ...paths(baseline)])].filter((p) => workspace[p] !== baseline[p]),
    [workspace, baseline],
  );
  const [file, setFile] = useState("index.html");

  return (
    <Tabs defaultValue="preview" className={styles.workspace}>
      <TabList aria-label="Workspace">
        <Tab value="preview">Preview</Tab>
        <Tab value="changes">
          Changes {changed.length > 0 && <Badge tone="accent">{changed.length}</Badge>}
        </Tab>
        <Tab value="files">Files</Tab>
      </TabList>
      <TabPanel value="preview" className={styles.workspacePanel}>
        <Preview workspace={workspace} baseline={baseline} />
      </TabPanel>
      <TabPanel value="changes" className={styles.workspacePanel}>
        {changed.length === 0 ? (
          <p className={styles.panelText}>No changes yet.</p>
        ) : (
          <div className={styles.changes}>
            {changed.map((p) => (
              <DiffView key={p} path={p} hunks={diffHunks(baseline[p] ?? null, workspace[p] ?? null)} />
            ))}
          </div>
        )}
      </TabPanel>
      <TabPanel value="files" className={styles.workspacePanel}>
        <div className={styles.files}>
          <Select label="File" hideLabel size="sm" value={file} onChange={(e) => setFile(e.target.value)} reserveMessageSpace={false}>
            {paths(workspace).map((p) => (
              <option key={p} value={p}>
                {p}
                {workspace[p] !== baseline[p] ? " (changed)" : ""}
              </option>
            ))}
          </Select>
          <pre className={styles.fileView} tabIndex={0} aria-label={`Contents of ${file}`}>
            {workspace[file] ?? "This file was deleted."}
          </pre>
        </div>
      </TabPanel>
    </Tabs>
  );
}
