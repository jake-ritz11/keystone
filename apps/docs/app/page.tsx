import { color } from "@keystone-ui/tokens";
import { Button, Input, Select, Tab, TabList, TabPanel, Tabs, Tooltip } from "@keystone-ui/ui";
import { ThemeToggle } from "./ThemeToggle";
import { DialogDemo } from "./demos/DialogDemo";
import { MenuDemo } from "./demos/MenuDemo";
import { ToastDemo } from "./demos/ToastDemo";

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" strokeLinecap="round" />
  </svg>
);

const regions = [
  <option key="eu" value="eu">Europe</option>,
  <option key="us" value="us">United States</option>,
  <option key="ap" value="ap">Asia Pacific</option>,
];

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

      <h2>Select</h2>
      <div className="grid">
        <Select label="Region" defaultValue="eu">
          {regions}
        </Select>
        <Select label="Plan" placeholder="Choose a plan" hint="You can change this later." required>
          <option value="free">Free</option>
          <option value="team">Team</option>
          <option value="enterprise" disabled>
            Enterprise (contact us)
          </option>
        </Select>
        <Select label="Time zone" placeholder="Select a time zone" error="Pick a time zone to continue.">
          <optgroup label="Europe">
            <option value="lon">London</option>
            <option value="ber">Berlin</option>
          </optgroup>
          <optgroup label="Americas">
            <option value="nyc">New York</option>
            <option value="sfo">San Francisco</option>
          </optgroup>
        </Select>
        <Select label="Disabled" disabled defaultValue="us">
          {regions}
        </Select>
      </div>
      <div className="row">
        <Select label="Small" size="sm" defaultValue="eu">
          {regions}
        </Select>
        <Select label="Medium" size="md" defaultValue="eu">
          {regions}
        </Select>
        <Select label="Large" size="lg" defaultValue="eu">
          {regions}
        </Select>
      </div>

      <h2>Dialog</h2>
      <DialogDemo />

      <h2>Menu</h2>
      <MenuDemo />

      <h2>Tabs</h2>
      <div className="stack">
        <Tabs defaultValue="overview">
          <TabList aria-label="Project">
            <Tab value="overview">Overview</Tab>
            <Tab value="activity">Activity</Tab>
            <Tab value="settings">Settings</Tab>
            <Tab value="billing" disabled>
              Billing
            </Tab>
          </TabList>
          <TabPanel value="overview">Underline tabs. Arrow keys move between tabs and select as they go.</TabPanel>
          <TabPanel value="activity">Recent changes would be listed here.</TabPanel>
          <TabPanel value="settings">Settings for the project would go here.</TabPanel>
          <TabPanel value="billing">Billing is unavailable.</TabPanel>
        </Tabs>

        <Tabs defaultValue="day" variant="segmented" activation="manual">
          <TabList aria-label="Range">
            <Tab value="day">Day</Tab>
            <Tab value="week">Week</Tab>
            <Tab value="month">Month</Tab>
          </TabList>
          <TabPanel value="day">Segmented, manual activation: arrows move focus, Enter or Space selects.</TabPanel>
          <TabPanel value="week">Weekly view.</TabPanel>
          <TabPanel value="month">Monthly view.</TabPanel>
        </Tabs>

        <Tabs defaultValue="general" orientation="vertical">
          <TabList aria-label="Account settings">
            <Tab value="general">General</Tab>
            <Tab value="security">Security</Tab>
            <Tab value="notifications">Notifications</Tab>
          </TabList>
          <TabPanel value="general">Vertical tabs use the up and down arrows.</TabPanel>
          <TabPanel value="security">Security settings.</TabPanel>
          <TabPanel value="notifications">Notification settings.</TabPanel>
        </Tabs>
      </div>

      <h2>Tooltip</h2>
      <div className="row">
        <Tooltip content="Saves a copy to your workspace">
          <Button variant="secondary">Hover or focus me</Button>
        </Tooltip>
        <Tooltip content="Search" kind="label">
          <Button variant="secondary">
            <SearchIcon />
          </Button>
        </Tooltip>
        <Tooltip content="Opens below, and flips if there is no room" side="bottom">
          <Button variant="ghost">Bottom</Button>
        </Tooltip>
        <Tooltip content="No delay on this one" delay={0}>
          <Button variant="ghost">Instant</Button>
        </Tooltip>
      </div>
      <p className="note">
        The search button is icon-only, so its tooltip is its accessible name. Escape dismisses
        any tooltip.
      </p>

      <h2>Toast</h2>
      <ToastDemo />

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
