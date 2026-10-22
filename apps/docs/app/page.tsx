import { color } from "@keystone-ui/tokens";
import { Button, Input } from "@keystone-ui/ui";
import { ThemeToggle } from "./ThemeToggle";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" strokeLinecap="round" />
  </svg>
);

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

      <h2>Input</h2>
      <div className="grid">
        <Input label="Name" placeholder="Ada Lovelace" />
        <Input label="Email" type="email" hint="Used only for sign-in." required />
        <Input label="Username" defaultValue="ada" error="That username is taken." />
        <Input label="Workspace ID" defaultValue="ks-0042" readOnly hint="Read-only." />
        <Input label="Disabled" placeholder="Not editable" disabled />
      </div>
      <div className="row">
        <Input label="Search" hideLabel placeholder="Search components" iconStart={<SearchIcon />} />
      </div>
      <div className="row">
        <Input label="Small" size="sm" placeholder="sm" />
        <Input label="Medium" size="md" placeholder="md" />
        <Input label="Large" size="lg" placeholder="lg" />
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
