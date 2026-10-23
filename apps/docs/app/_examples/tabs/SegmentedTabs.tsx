import { Tab, TabList, TabPanel, Tabs } from "@keystone-ui/ui";

export function SegmentedTabs() {
  return (
    <Tabs defaultValue="day" variant="segmented" activation="manual">
      <TabList aria-label="Range">
        <Tab value="day">Day</Tab>
        <Tab value="week">Week</Tab>
        <Tab value="month">Month</Tab>
      </TabList>
      <TabPanel value="day">Arrows move focus; Enter or Space selects.</TabPanel>
      <TabPanel value="week">Weekly view.</TabPanel>
      <TabPanel value="month">Monthly view.</TabPanel>
    </Tabs>
  );
}
