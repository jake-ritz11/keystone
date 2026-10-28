import Link from "next/link";
import { COMPONENTS } from "@keystone-ui/ui/docs";
import { checkSummary } from "./_docs/blocks";
import { components, REPO } from "./_docs/registry";
import { testingFor } from "./_docs/testing";

export default function Overview() {
  return (
    <article className="doc">
      <header className="doc-header">
        <h1>Keystone</h1>
        <p className="lede">
          A token-driven React design system built on the web platform and tested in real browsers. It
          includes an MCP server so that Claude can build components from it and audit them against it.
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
              Dialog is a <code>&lt;dialog&gt;</code>, Menu and Tooltip are popovers, and Select is a
              select. Keystone adds the keyboard models, controlled state and announcements that the browser
              leaves out.
            </p>
          </li>
          <li>
            <h3>Proven in browsers</h3>
            <p>
              On every push, keyboard, focus and ARIA behavior is tested with Playwright in Chromium, WebKit
              and Firefox, and every example is compared against screenshots in both themes.
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

      <section className="doc-section" aria-labelledby="tested">
        <h2 id="tested">How each component is tested</h2>
        <p>
          Every page passes axe in light, dark and both high-contrast themes. The behavior specs and NVDA results are
          read from the tests and the <Link href="/writing/screen-reader-checklist">screen-reader checklist</Link>{" "}
          when the site builds, so this table cannot claim more than they show.
        </p>
        <div className="table-scroll" role="region" aria-label="Testing by component" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Component</th>
                <th scope="col">Behavior specs</th>
                <th scope="col">Screen reader</th>
              </tr>
            </thead>
            <tbody>
              {COMPONENTS.map((c) => {
                const { specs, checks } = testingFor(c.slug);
                return (
                  <tr key={c.slug}>
                    <th scope="row">
                      <Link href={`/components/${c.slug}`}>{c.name}</Link>
                    </th>
                    <td>{specs.length ? specs.join(", ") : "None yet"}</td>
                    <td>{checkSummary(checks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc-section" aria-labelledby="more">
        <h2 id="more">More</h2>
        <ul className="notes">
          <li>
            <Link href="/tokens">Tokens</Link> shows the full scale in both themes.
          </li>
          <li>
            <Link href="/writing/decisions">Decisions</Link> explains why it is built this way, what broke,
            and what the tests do and do not prove. <Link href="/writing">Writing</Link> has more.
          </li>
          <li>
            <a href={REPO}>Source on GitHub</a>, including the MCP server and its{" "}
            <code>get_component</code>, <code>generate_component</code> and{" "}
            <code>audit_component</code> tools.
          </li>
        </ul>
      </section>
    </article>
  );
}
