import { Tab, TabList, TabPanel, Tabs } from "@keystone-ui/ui";

export function UnderlineTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabList aria-label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
        <Tab value="billing" disabled>
          Billing
        </Tab>
      </TabList>
      <TabPanel value="overview">Arrow keys move between tabs and select as they go.</TabPanel>
      <TabPanel value="activity">Recent changes would be listed here.</TabPanel>
      <TabPanel value="settings">Settings for the project would go here.</TabPanel>
      <TabPanel value="billing">Billing is unavailable.</TabPanel>
    </Tabs>
  );
}
