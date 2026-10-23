import type { Metadata } from "next";
import { color, font, motion, radius, space } from "@keystone-ui/tokens";
import { DocPage, Section } from "../_docs/blocks";
import { MotionDemo } from "./MotionDemo";

export const metadata: Metadata = { title: "Tokens" };

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const USES: Record<keyof typeof color.light, string> = {
  bg: "Page background.",
  surface: "Cards, inputs, dialogs, menus.",
  surfaceRaised: "Hover fills, read-only fields, table headers.",
  border: "Dividers and control outlines.",
  borderStrong: "Field and control outlines on hover.",
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

function Swatch({ value }: { value: string }) {
  return (
    <span className="token-swatch">
      {/* Raw values on purpose: this page shows both themes side by side, whatever theme is on. */}
      <span className="token-chip" style={{ background: value }} aria-hidden="true" />
      <code>{value}</code>
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
          Light and dark are both shown here regardless of the current theme. The page follows the
          system theme unless the toggle pins one.
        </p>
        <div className="table-scroll" role="region" aria-label="Color tokens" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">Light</th>
                <th scope="col">Dark</th>
                <th scope="col">Use</th>
              </tr>
            </thead>
            <tbody>
              {colorKeys.map((key) => (
                <tr key={key}>
                  <th scope="row">
                    <code>--ks-color-{kebab(key)}</code>
                  </th>
                  <td>
                    <Swatch value={color.light[key]} />
                  </td>
                  <td>
                    <Swatch value={color.dark[key]} />
                  </td>
                  <td>{USES[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          Every component with a transition has a <code>prefers-reduced-motion</code> fallback,
          usually a shorter fade with no movement. The audit checks for it.
        </p>
        <MotionDemo
          rows={[
            ...Object.keys(motion.duration).map((name) => ({
              label: `duration-${name} · standard`,
              duration: `--ks-motion-duration-${name}`,
              easing: "--ks-motion-easing-standard",
            })),
            {
              label: "duration-slow · emphasized",
              duration: "--ks-motion-duration-slow",
              easing: "--ks-motion-easing-emphasized",
            },
          ]}
        />
      </Section>
    </DocPage>
  );
}
