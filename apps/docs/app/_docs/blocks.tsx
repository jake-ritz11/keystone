import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { api } from "@keystone-ui/ui/docs";
import { CodeBlock } from "./CodeBlock";
import { REPO } from "./registry";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function DocPage({
  title,
  lede,
  builtOn,
  source,
  children,
}: {
  title: string;
  lede: ReactNode;
  /** The platform feature it stands on, e.g. "the native <dialog> element". */
  builtOn?: ReactNode;
  /** Repo path of the component folder. */
  source?: string;
  children: ReactNode;
}) {
  return (
    <article className="doc">
      <header className="doc-header">
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
        {(builtOn || source) && (
          <p className="doc-meta">
            {builtOn && <span>Built on {builtOn}</span>}
            {source && <a href={`${REPO}/tree/main/${source}`}>Source</a>}
          </p>
        )}
      </header>
      {children}
    </article>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = slugify(title);
  return (
    <section className="doc-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * A live example and the exact file that renders it. The code shown is read from disk at build
 * time, so it can't drift from what's on screen.
 */
export function Example({ title, file, children, note }: { title: string; file: string; children: ReactNode; note?: ReactNode }) {
  const code = readFileSync(join(process.cwd(), "app/_examples", file), "utf8").trimEnd();
  return (
    <div className="example">
      <h3>{title}</h3>
      {note && <p className="example-note">{note}</p>}
      <div className="example-preview">{children}</div>
      <details className="example-code">
        <summary>Show code</summary>
        <CodeBlock code={code} label={title} />
      </details>
    </div>
  );
}

function ScrollTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    // Focusable and named so a keyboard user can scroll a wide table on a narrow screen.
    <div className="table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table>{children}</table>
    </div>
  );
}

export function PropsTables({ component }: { component: string }) {
  const entry = api[component];
  if (!entry) throw new Error(`No API docs for "${component}".`);
  return (
    <>
      {entry.parts.map((part) => (
        <div className="props" key={part.interface}>
          {entry.parts.length > 1 && <h3>{part.interface.replace(/Props$/, "")}</h3>}
          <ScrollTable label={`${part.interface} props`}>
            <thead>
              <tr>
                <th scope="col">Prop</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {part.props.map((prop) => (
                <tr key={prop.name}>
                  <th scope="row">
                    <code>{prop.name}</code>
                    {prop.required && <span className="required-tag">required</span>}
                  </th>
                  <td>
                    <code>{prop.type}</code>
                  </td>
                  <td>{prop.default ? <code>{prop.default}</code> : <span aria-label="none">–</span>}</td>
                  <td>{prop.description}</td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>
          {part.extends && <p className="props-extends">Also accepts {part.extends}.</p>}
          {part.note && <p className="props-extends">{part.note}</p>}
        </div>
      ))}
    </>
  );
}

export function KeyboardTable({ component }: { component: string }) {
  const keyboard = api[component]?.keyboard;
  if (!keyboard) return null;
  return (
    <ScrollTable label="Keyboard interactions">
      <thead>
        <tr>
          <th scope="col">Keys</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {keyboard.map((row, i) => (
          <tr key={i}>
            <th scope="row">
              {row.keys.split(", ").map((key, j) => (
                <span key={key}>
                  {j > 0 && " "}
                  <kbd>{key}</kbd>
                </span>
              ))}
            </th>
            <td>{row.action}</td>
          </tr>
        ))}
      </tbody>
    </ScrollTable>
  );
}

export function Notes({ items }: { items: ReactNode[] }) {
  return (
    <ul className="notes">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
