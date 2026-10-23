import { Tab, TabList, TabPanel, Tabs } from "@keystone-ui/ui";

export function VerticalTabs() {
  return (
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
  );
}
