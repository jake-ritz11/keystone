import Link from "next/link";
import { components, REPO } from "./_docs/registry";

export default function Overview() {
  return (
    <article className="doc">
      <header className="doc-header">
        <h1>Keystone</h1>
        <p className="lede">
          A token-driven React design system, built on the web platform and tested in real
          browsers, with an MCP server so Claude can build components from it and audit them
          against it.
        </p>
      </header>

      <section className="doc-section" aria-labelledby="principles">
        <h2 id="principles">Principles</h2>
        <ul className="principles">
          <li>
            <h3>Tokens only</h3>
            <p>
              Every color, space, radius, font and duration is a <code>--ks-*</code> variable. An
              audit fails the build on a raw hex value or off-scale spacing.
            </p>
          </li>
          <li>
            <h3>Platform first</h3>
            <p>
              Dialog is a <code>&lt;dialog&gt;</code>, Menu and Tooltip are popovers, Select is a
              select. Keystone adds what the browser leaves out: keyboard models, controlled
              state, announcements.
            </p>
          </li>
          <li>
            <h3>Proven in browsers</h3>
            <p>
              Keyboard, focus and ARIA behavior is tested with Playwright in Chromium, WebKit
              and Firefox, on every push.
            </p>
          </li>
        </ul>
      </section>

      <section className="doc-section" aria-labelledby="components">
        <h2 id="components">Components</h2>
        <ul className="cards">
          {components.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="card">
                <span className="card-title">{c.title}</span>
                <span className="card-summary">{c.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="doc-section" aria-labelledby="more">
        <h2 id="more">More</h2>
        <ul className="notes">
          <li>
            <Link href="/tokens">Tokens</Link>: the full scale, in both themes.
          </li>
          <li>
            <a href={`${REPO}/blob/main/docs/decisions.md`}>Decisions</a>: why it's built this way,
            what broke, and what the tests do and don't prove.
          </li>
          <li>
            <a href={REPO}>Source on GitHub</a>, including the MCP server and its{" "}
            <code>generate_component</code> and <code>audit_component</code> tools.
          </li>
        </ul>
      </section>
    </article>
  );
}
