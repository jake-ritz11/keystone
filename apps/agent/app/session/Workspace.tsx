"use client";

import { useMemo, useState } from "react";
import { diffHunks, paths, type Workspace } from "@keystone-ui/agent-core";
import { Badge, DiffView, SegmentedControl, Select, Tab, TabList, TabPanel, Tabs } from "@keystone-ui/ui";
import styles from "./session.module.css";

/**
 * The preview's chosen scheme, applied to the page's own media queries: always-true for the
 * chosen one, always-false for the other. Browsers differ on whether an iframe's color-scheme
 * reaches the page inside it, so this doesn't rely on it.
 */
function withScheme(html: string, scheme: "light" | "dark"): string {
  return html.replace(/\(\s*prefers-color-scheme\s*:\s*(light|dark)\s*\)/g, (_, wanted: string) =>
    wanted === scheme ? "(min-width: 0px)" : "(max-width: 0px)",
  );
}

/** Inlines a page's linked stylesheets, so it renders from the in-memory workspace. */
function pageDocument(workspace: Workspace, page: string, scheme: "light" | "dark"): string {
  const html = workspace[page] ?? "<p>This page doesn't exist.</p>";
  const inlined = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g, (tag, href: string) => {
    const css = workspace[href.replace(/^\.?\//, "")];
    return css === undefined ? tag : `<style>\n${css}\n</style>`;
  });
  return withScheme(inlined, scheme);
}

function Preview({ workspace, baseline }: { workspace: Workspace; baseline: Workspace }) {
  const pages = paths(workspace).filter((p) => p.endsWith(".html"));
  // Open on the home page; the list itself is alphabetical.
  const [page, setPage] = useState(pages.includes("index.html") ? "index.html" : (pages[0] ?? "index.html"));
  const [side, setSide] = useState<"after" | "before">("after");
  const [width, setWidth] = useState<"desktop" | "phone">("desktop");
  const [scheme, setScheme] = useState<"light" | "dark">("light");
  const source = side === "after" ? workspace : baseline;
  const doc = useMemo(() => pageDocument(source, page, scheme), [source, page, scheme]);

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
        <SegmentedControl
          aria-label="Version"
          size="sm"
          value={side}
          onValueChange={setSide}
          options={[
            { value: "after", label: "Now" },
            { value: "before", label: "Before" },
          ]}
        />
        <SegmentedControl
          aria-label="Color scheme"
          size="sm"
          value={scheme}
          onValueChange={setScheme}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
        <SegmentedControl
          aria-label="Width"
          size="sm"
          value={width}
          onValueChange={setWidth}
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "phone", label: "Phone" },
          ]}
        />
      </div>
      <div className={styles.frameWrap} data-width={width}>
        {/* No scripts, no same-origin: the agent's HTML can render but can't do anything. */}
        {/* The frame's color-scheme becomes the page's prefers-color-scheme, so a site's dark
            mode can be previewed without changing the app's theme. */}
        <iframe className={styles.frame} title={`Preview of ${page}`} sandbox="" srcDoc={doc} style={{ colorScheme: scheme }} />
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
