import { expect, test, type Page } from "@playwright/test";
import { turn } from "./turn";

const conversation = (page: Page) => page.getByRole("list", { name: "Conversation" });
const fileView = (page: Page) => page.getByRole("tabpanel", { name: "Files" }).locator("pre");

test("a file the agent mentions opens in the Files tab; a name that isn't a file stays text", async ({ page }) => {
  await page.goto("/?speed=fast");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: /Fix the broken link/ }).click();
  await expect(conversation(page)).toContainText("That's a typo");

  // "abuot.html" is the typo the agent is describing, not a file, so it isn't a link.
  await expect(conversation(page).getByRole("button", { name: "abuot.html" })).toHaveCount(0);
  await conversation(page).getByRole("button", { name: "about.html" }).first().click();

  await expect(page.getByRole("tab", { name: "Files" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("combobox", { name: "File" })).toHaveValue("about.html");
  // Focus follows, so the next thing read or typed is about the file.
  await expect(fileView(page)).toBeFocused();
  await expect(fileView(page)).toHaveAccessibleName("Contents of about.html");
});

test("a cited line is marked, scrolled into view and named; a range marks every line in it", async ({ page }) => {
  await page.route("**/api/turn", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ json: { live: true, model: "claude-opus-5-5" } })
      : route.fulfill({
          status: 200,
          headers: { "content-type": "text/event-stream" },
          body: turn([{ text: "The pricing section starts at `index.html:40`, and its styles are in styles.css:60-64." }], "end_turn"),
        }),
  );
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Live" }).click();
  await page.getByRole("button", { name: /Fix the broken link/ }).click();

  await conversation(page).getByRole("button", { name: "index.html:40" }).click();
  await expect(fileView(page)).toHaveAccessibleName("Contents of index.html, line 40 marked");
  const line = fileView(page).locator('[data-line="40"]');
  await expect(line).toHaveAttribute("data-cited", "true");
  await expect(fileView(page).locator("[data-cited]")).toHaveCount(1);
  // Scrolled within the file view, which is the scroller, so check against its box.
  const [view, cited] = [(await fileView(page).boundingBox())!, (await line.boundingBox())!];
  expect(cited.y).toBeGreaterThanOrEqual(view.y);
  expect(cited.y + cited.height).toBeLessThanOrEqual(view.y + view.height);

  await conversation(page).getByRole("button", { name: "styles.css:60-64" }).click();
  await expect(page.getByRole("combobox", { name: "File" })).toHaveValue("styles.css");
  await expect(fileView(page)).toHaveAccessibleName("Contents of styles.css, lines 60 to 64 marked");
  await expect(fileView(page).locator("[data-cited]")).toHaveCount(5);

  // Choosing another file by hand clears the mark.
  await page.getByRole("combobox", { name: "File" }).selectOption("index.html");
  await expect(fileView(page).locator("[data-cited]")).toHaveCount(0);
});
