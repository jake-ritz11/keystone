import type { Metadata } from "next";
import Link from "next/link";
import { color, colorHighContrast, font, highContrast, palette, radius, semantic, space, target } from "@keystone-ui/tokens";
import { DocPage, Section } from "../_docs/blocks";

export const metadata: Metadata = { title: "Tokens" };

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const USES: Record<keyof typeof color.light, string> = {
  bg: "Page background.",
  surface: "Cards, inputs, dialogs, menus.",
  surfaceRaised: "Hover fills, read-only fields, table headers.",
  border: "Dividers and control outlines.",
  borderStrong: "Card and row outlines on hover.",
  borderControl: "Outlines that identify a control: text fields, checkboxes. 3:1 or more.",
  borderControlHover: "Control outlines on hover.",
  text: "Body text. Also the tooltip background, inverted.",
  textMuted: "Secondary text, placeholders, icons.",
  accent: "Primary actions, links, selection.",
  accentHover: "Hover on accent fills.",
  accentText: "Text on accent and danger fills.",
  danger: "Errors and destructive actions.",
  dangerHover: "Hover on danger fills.",
  success: "Success icons.",
  focus: "Focus rings, everywhere.",
  scrim: "Behind modal dialogs.",
  shadow: "Elevation for popovers and dialogs.",
};

/** "{blue.600}" as the palette variable's short name, "blue-600". */
const step = (value: string) => /^\{(\w+)\.(\w+)\}$/.exec(value)?.slice(1).join("-");

function Swatch({ value, refValue }: { value: string; refValue?: string }) {
  const name = refValue && step(refValue);
  return (
    <span className="token-swatch">
      {/* Raw values on purpose: this page shows every theme side by side, whatever theme is on. */}
      <span className="token-chip" style={{ background: value }} aria-hidden="true" />
      <span className="token-swatch-text">
        <code>{value}</code>
        {name && <span className="token-ref">{name}</span>}
      </span>
    </span>
  );
}

export default function TokensPage() {
  const colorKeys = Object.keys(color.light) as (keyof typeof color.light)[];

  return (
    <DocPage
      title="Tokens"
      lede="The single source of truth. Components read these as CSS variables and never use a raw value; the audit enforces it."
      source="packages/tokens"
    >
      <Section title="Color">
        <p>
          Two tiers. The <strong>palette</strong> is every raw color, by hue and step. The{" "}
          <strong>semantic</strong> tokens say what a color is for and point at a palette step in each theme.
          Components only read the semantic tier, so a theme is a different set of pointers, never a different
          component. In dev tools that reads as <code>--ks-color-accent: var(--ks-palette-blue-600)</code>.
        </p>
        <p>
          High contrast follows <code>prefers-contrast: more</code>, and <code>data-contrast</code> on the root pins
          it either way. It changes only the tokens listed in its columns. A unit test checks every pair that has to
          be read or found against WCAG: 4.5:1 for text and 3:1 for control outlines, and 7:1 and 4.5:1 in high
          contrast. All columns are shown whatever theme this page is in.
        </p>
        <div className="table-scroll" role="region" aria-label="Semantic color tokens" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">Light</th>
                <th scope="col">Dark</th>
                <th scope="col">Light, high contrast</th>
                <th scope="col">Dark, high contrast</th>
              </tr>
            </thead>
            <tbody>
              {colorKeys.map((key) => {
                const lightMore = (highContrast.light as Partial<Record<string, string>>)[key];
                const darkMore = (highContrast.dark as Partial<Record<string, string>>)[key];
                return (
                  <tr key={key}>
                    <th scope="row">
                      <code>--ks-color-{kebab(key)}</code>
                      <span className="token-use">{USES[key]}</span>
                    </th>
                    <td>
                      <Swatch value={color.light[key]} refValue={semantic.light[key]} />
                    </td>
                    <td>
                      <Swatch value={color.dark[key]} refValue={semantic.dark[key]} />
                    </td>
                    <td>{lightMore ? <Swatch value={colorHighContrast.light[key]} refValue={lightMore} /> : <span className="token-same">Same</span>}</td>
                    <td>{darkMore ? <Swatch value={colorHighContrast.dark[key]} refValue={darkMore} /> : <span className="token-same">Same</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <h3 className="token-subhead">Palette</h3>
        <p>
          Every raw color, as <code>--ks-palette-[hue]-[step]</code>. Steps run from light to dark. A test fails if
          any step goes unused, so the palette can&apos;t collect colors nobody needs.
        </p>
        {Object.entries(palette).map(([hue, steps]) => (
          <div key={hue} className="palette-row">
            <h4 className="palette-hue">{hue}</h4>
            <ul className="palette-steps">
              {Object.entries(steps).map(([n, hex]) => (
                <li key={n}>
                  {/* Raw value on purpose: this is the palette itself. */}
                  <span className="palette-chip" style={{ background: hex }} aria-hidden="true" />
                  <code>{n}</code>
                  <span className="token-ref">{hex}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p>
          The published package also ships these as <code>tokens.json</code> in the{" "}
          <a href="https://www.designtokens.org/">W3C Design Tokens format</a>, with the semantic colors kept as
          references to the palette, for Style Dictionary, Figma plugins and other platforms.
        </p>
      </Section>

      <Section title="Space">
        <p>A 4px scale for padding, margin and gap. The audit flags any raw px spacing.</p>
        <ul className="token-list">
          {Object.entries(space).map(([step, value]) => (
            <li key={step} className="token-row">
              <code>--ks-space-{step}</code>
              <span className="token-value">{value}</span>
              <span className="space-bar" style={{ width: `var(--ks-space-${step})` }} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Target size">
        <p>
          The smallest a control&apos;s hit area can be. Every control is at least <code>--ks-target-min</code>, WCAG
          2.5.8&apos;s floor; on a touch screen (<code>pointer: coarse</code>) controls grow to{" "}
          <code>--ks-target-touch</code>, Apple&apos;s minimum for a fingertip. The hit area can be bigger than what&apos;s
          drawn: padding counts.
        </p>
        <ul className="token-list">
          {Object.entries(target).map(([name, value]) => (
            <li key={name} className="token-row">
              <code>--ks-target-{name}</code>
              <span className="token-value">{value}</span>
              <span className="space-bar" style={{ width: `var(--ks-target-${name})` }} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Radius">
        <ul className="radius-list">
          {Object.entries(radius).map(([name, value]) => (
            <li key={name}>
              <span className="radius-box" style={{ borderRadius: `var(--ks-radius-${name})` }} aria-hidden="true" />
              <code>--ks-radius-{name}</code>
              <span className="token-value">{value}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type">
        <ul className="token-list">
          {Object.entries(font.size).map(([name, value]) => (
            <li key={name} className="type-row">
              <code>--ks-font-size-{name}</code>
              <span className="token-value">{value}</span>
              <span style={{ fontSize: `var(--ks-font-size-${name})`, lineHeight: "var(--ks-font-line-height-tight)" }}>
                Make the system the default
              </span>
            </li>
          ))}
        </ul>
        <h3 className="token-subhead">Weight, line height and family</h3>
        <ul className="token-list">
          {Object.entries(font.weight).map(([name, value]) => (
            <li key={name} className="type-row">
              <code>--ks-font-weight-{name}</code>
              <span className="token-value">{value}</span>
              <span style={{ fontWeight: `var(--ks-font-weight-${name})` }}>Make the system the default</span>
            </li>
          ))}
          {Object.entries(font.lineHeight).map(([name, value]) => (
            <li key={name} className="type-row">
              <code>--ks-font-line-height-{kebab(name)}</code>
              <span className="token-value">{value}</span>
              <span className="token-note">{name === "tight" ? "Headings and controls." : "Body text."}</span>
            </li>
          ))}
          {Object.entries(font.family).map(([name]) => (
            <li key={name} className="type-row">
              <code>--ks-font-family-{name}</code>
              <span className="token-value">{name}</span>
              <span style={{ fontFamily: `var(--ks-font-family-${name})` }}>Make the system the default</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Motion">
        <p>
          Durations and easings, with what each is for, live demos and every pattern built from them, are on{" "}
          <Link href="/motion">Motion</Link>.
        </p>
      </Section>
    </DocPage>
  );
}
