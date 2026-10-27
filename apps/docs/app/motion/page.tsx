import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "@keystone-ui/tokens";
import { DocPage, Notes, Section } from "../_docs/blocks";
import { EasingCurve } from "./EasingCurve";
import { MotionDemo } from "./MotionDemo";

export const metadata: Metadata = { title: "Motion" };

const DURATION_USE: Record<keyof typeof motion.duration, string> = {
  fast: "Hover and press feedback, exits, anything the pointer is waiting on.",
  normal: "Small state changes: a border, a color, a ring.",
  slow: "Entrances, a bar filling, a check drawing in.",
  ambient: "One cycle of a looping \"still working\" signal.",
};

/** Every motion pattern in the kit and the agent app, and what reduced motion turns it into. */
const PATTERNS: { pattern: string; where: ReactNode; timing: string; reduced: string }[] = [
  {
    pattern: "Rise in",
    where: (
      <>
        <Link href="/components/dialog">Dialog</Link>, <Link href="/components/toast">Toast</Link>, new agent messages, the
        review panel
      </>
    ),
    timing: "a small translate: normal · standard for Dialog, normal · emphasized for Toast, slow · standard in the agent app",
    reduced: "Dialog and Toast fade without moving; agent messages simply appear.",
  },
  {
    pattern: "Fade out",
    where: (
      <>
        <Link href="/components/dialog">Dialog</Link>, <Link href="/components/menu">Menu</Link>,{" "}
        <Link href="/components/tooltip">Tooltip</Link>
      </>
    ),
    timing: "fast · standard, opacity only",
    reduced: "Dialog keeps a quick fade; Menu and Tooltip close at once.",
  },
  {
    pattern: "Stagger",
    where: "The agent app's task cards",
    timing: "slow · standard, each half a fast step after the last",
    reduced: "All appear together.",
  },
  {
    pattern: "Slide",
    where: <Link href="/components/command-menu">CommandMenu</Link>,
    timing: "fast · standard: one highlight moving between rows",
    reduced: "Jumps to the row.",
  },
  {
    pattern: "Sweep",
    where: <Link href="/components/shimmer">Shimmer</Link>,
    timing: "ambient · linear",
    reduced: "Plain text.",
  },
  {
    pattern: "Pulse",
    where: (
      <>
        <Link href="/components/badge">Badge</Link> with <code>pulse</code>, the streaming caret
      </>
    ),
    timing: "ambient · standard",
    reduced: "A still dot.",
  },
  {
    pattern: "Turn",
    where: (
      <>
        The current plan step, <Link href="/components/button">Button</Link>&apos;s loading spinner
      </>
    ),
    timing: "about a second a turn · linear",
    reduced: "The step shows a full ring. The spinner slows to one turn every two seconds instead of stopping, since it's the only sign of loading.",
  },
  {
    pattern: "Draw",
    where: "A plan step's check, when it completes",
    timing: "slow · standard, after a fast-step delay",
    reduced: "The check is simply there.",
  },
  {
    pattern: "Fill",
    where: "The plan's progress bar",
    timing: "slow · standard",
    reduced: "Jumps to the new value.",
  },
  {
    pattern: "Bump",
    where: "The agent app's Changes count",
    timing: "slow · emphasized: overshoots, then settles",
    reduced: "No bump.",
  },
  {
    pattern: "Dissolve",
    where: "The agent app's preview, between versions",
    timing: "slow · standard",
    reduced: "Swaps at once.",
  },
  {
    pattern: "Expand",
    where: <Link href="/components/disclosure">Disclosure</Link>,
    timing: "normal · standard, height through interpolate-size",
    reduced: "Opens at once.",
  },
];

export default function MotionPage() {
  return (
    <DocPage
      title="Motion"
      lede="Motion says what changed and what's still happening. It never decorates, and it never makes anyone wait."
      source="packages/tokens"
    >
      <Section title="Principles">
        <Notes
          items={[
            <>
              <strong>Every animation carries information.</strong> Something arrived, something is still running,
              something finished. If it says nothing, it doesn&apos;t move.
            </>,
            <>
              <strong>Entrances rise; exits fade.</strong> Arrivals move a few pixels so the eye finds them. Leaving is
              quicker and doesn&apos;t move, since nobody needs to watch something go. Nothing scales, because scaled
              text blurs.
            </>,
            <>
              <strong>Loops are slow.</strong> Anything that repeats while work runs takes the two-second ambient cycle,
              calm enough to sit beside text someone is reading.
            </>,
            <>
              <strong>Nothing moves under the pointer.</strong> Layout stays put while things animate, so a click
              always lands where it was aimed.
            </>,
            <>
              <strong>Reduced motion keeps the meaning.</strong> Movement goes; the state it showed stays, in words,
              color or a still mark. The audit fails any component without a fallback.
            </>,
          ]}
        />
      </Section>

      <Section title="Easing">
        <p>
          Two curves. Standard decelerates hard, so things arrive quickly and settle. Emphasized overshoots a little,
          for the rare moment that should land like a beat.
        </p>
        <div className="easings">
          {Object.entries(motion.easing).map(([name, value]) => (
            <EasingCurve key={name} name={`--ks-motion-easing-${name}`} value={value} />
          ))}
        </div>
      </Section>

      <Section title="Duration">
        <div className="table-scroll" role="region" aria-label="Duration tokens" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">Value</th>
                <th scope="col">Use</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(motion.duration) as (keyof typeof motion.duration)[]).map((name) => (
                <tr key={name}>
                  <th scope="row">
                    <code>--ks-motion-duration-{name}</code>
                  </th>
                  <td>
                    <code>{motion.duration[name]}</code>
                  </td>
                  <td>{DURATION_USE[name]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <MotionDemo
          rows={[
            ...(["fast", "normal", "slow"] as const).map((name) => ({
              label: `duration-${name} · standard`,
              duration: `--ks-motion-duration-${name}`,
              easing: "--ks-motion-easing-standard",
            })),
            { label: "duration-slow · emphasized", duration: "--ks-motion-duration-slow", easing: "--ks-motion-easing-emphasized" },
          ]}
        />
      </Section>

      <Section title="Patterns">
        <p>Every motion in the kit and the agent app, and what each becomes with reduced motion on.</p>
        <div className="table-scroll" role="region" aria-label="Motion patterns" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Pattern</th>
                <th scope="col">Where</th>
                <th scope="col">Timing</th>
                <th scope="col">Reduced motion</th>
              </tr>
            </thead>
            <tbody>
              {PATTERNS.map((p) => (
                <tr key={p.pattern}>
                  <th scope="row">{p.pattern}</th>
                  <td>{p.where}</td>
                  <td>{p.timing}</td>
                  <td>{p.reduced}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </DocPage>
  );
}
