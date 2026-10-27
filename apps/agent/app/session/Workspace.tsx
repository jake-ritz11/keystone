"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface Frame {
  id: number;
  doc: string;
  ready: boolean;
}

/**
 * The preview, double-buffered. A new document loads in a second frame behind the current one
 * and fades in once it has rendered, so an edit (or Now / Before) dissolves into place instead
 * of blinking through an empty frame. Only the newest frame is named and reachable.
 */
function PreviewFrame({ doc, title, scheme }: { doc: string; title: string; scheme: "light" | "dark" }) {
  const nextId = useRef(1);
  const [frames, setFrames] = useState<Frame[]>([{ id: 0, doc, ready: true }]);

  useEffect(() => {
    setFrames((current) => (current.at(-1)?.doc === doc ? current : [...current.slice(-1), { id: nextId.current++, doc, ready: false }]));
  }, [doc]);

  const newest = frames.at(-1)!;
  const markReady = (id: number) => setFrames((all) => all.map((f) => (f.id === id && !f.ready ? { ...f, ready: true } : f)));

  // If a load event never comes, show the frame anyway rather than leave the old page up.
  useEffect(() => {
    if (newest.ready) return;
    const timer = setTimeout(() => markReady(newest.id), 1000);
    return () => clearTimeout(timer);
  }, [newest.id, newest.ready]);

  // Once the newest frame has faded in, drop the ones under it: when its fade ends, or after a
  // while regardless (reduced motion has no fade, so no transitionend).
  const dropOlder = () => setFrames((current) => (current.length > 1 ? current.slice(-1) : current));
  useEffect(() => {
    if (!newest.ready || frames.length === 1) return;
    const timer = setTimeout(dropOlder, 1000);
    return () => clearTimeout(timer);
  }, [newest.ready, frames.length]);

  return frames.map((frame) => {
    const current = frame.id === newest.id;
    return (
      // No scripts, no same-origin: the agent's HTML can render but can't do anything. The
      // frame's color-scheme becomes the page's, so a site's dark mode can be previewed
      // without changing the app's theme.
      <iframe
        key={frame.id}
        className={styles.frame}
        title={current ? title : undefined}
        aria-hidden={current ? undefined : true}
        tabIndex={current ? undefined : -1}
        sandbox=""
        srcDoc={frame.doc}
        style={{ colorScheme: scheme }}
        data-ready={frame.ready || undefined}
        onLoad={() => markReady(frame.id)}
        onTransitionEnd={current ? dropOlder : undefined}
      />
    );
  });
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
        <PreviewFrame doc={doc} title={`Preview of ${page}`} scheme={scheme} />
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
          Changes{" "}
          {changed.length > 0 && (
            // Keyed on the count, so each new change remounts it and it bumps once.
            <Badge key={changed.length} tone="accent" className={styles.bump}>
              {changed.length}
            </Badge>
          )}
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
