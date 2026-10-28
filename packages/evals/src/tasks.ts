/**
 * The UI tasks every condition is given. Each is a small, ordinary product feature that the kit
 * covers, so the question is whether the model reaches for the kit and follows its rules, not
 * whether it can do something the kit can't. `expects` lists the components a good answer uses:
 * each entry is a set of alternatives, and one of them is enough.
 */
export interface EvalTask {
  id: string;
  prompt: string;
  expects: string[][];
}

export const TASKS: EvalTask[] = [
  {
    id: "delete-confirm",
    prompt: "A Delete project button that asks for confirmation in a modal before deleting. The confirming button says what it does.",
    expects: [["Button"], ["Dialog"]],
  },
  {
    id: "notification-settings",
    prompt: "A notification settings panel: email notifications on or off, a digest frequency of daily, weekly or never, and a Save button.",
    expects: [["Switch", "Checkbox"], ["SegmentedControl", "RadioGroup", "Select"], ["Button"]],
  },
  {
    id: "sign-up",
    prompt: "A sign-up form with name, email and password. The password has a hint about its rules, and errors show under the field they belong to.",
    expects: [["Input"], ["Button"]],
  },
  {
    id: "profile-tabs",
    prompt: "A profile page with three tabs: Overview, Activity and Settings, each with placeholder content.",
    expects: [["Tabs"]],
  },
  {
    id: "upload-progress",
    prompt: "A list of three files being uploaded, each with its progress, and a notification once all of them are done.",
    expects: [["Progress"], ["ToastProvider", "useToast"]],
  },
  {
    id: "faq",
    prompt: "A frequently asked questions section with five questions whose answers expand and collapse.",
    expects: [["Accordion", "Disclosure"]],
  },
  {
    id: "row-actions",
    prompt: "A row in a list of documents with an overflow menu offering Rename, Duplicate and Delete.",
    expects: [["Menu"]],
  },
  {
    id: "deploy-card",
    prompt: "A deployment status card with the project name, a status of building, live or failed, and a Retry button when it failed. The card itself needs its own styles.",
    expects: [["Badge"], ["Button"]],
  },
];
