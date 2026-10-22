import { color } from "@keystone-ui/tokens";
import { Button } from "@keystone-ui/ui";
import { ThemeToggle } from "./ThemeToggle";

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export default function Home() {
  return (
    <main>
      <div className="header">
        <div>
          <h1>Keystone</h1>
          <p className="lede">
            A token-driven React design system, with Claude tools that generate and audit
            components against it.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <h2>Button</h2>
      <div className="row">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Delete</Button>
      </div>
      <div className="row">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="row">
        <Button loading>Saving</Button>
        <Button disabled>Disabled</Button>
      </div>

      <h2>Color tokens</h2>
      <div className="swatches">
        {Object.keys(color.light).map((key) => {
          const name = `--ks-color-${kebab(key)}`;
          return (
            <div className="swatch" key={key}>
              <div className="swatch-chip" style={{ background: `var(${name})` }} />
              <span className="swatch-name">{name}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
