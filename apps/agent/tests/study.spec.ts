import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const status = (page: Page) => page.getByRole("status").filter({ hasText: /Working|Waiting|Done|Stopped|Something/ }).first();
const stored = (page: Page) => page.evaluate(() => localStorage.getItem("keystone-study"));

async function open(page: Page) {
  await page.goto("/?speed=fast");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

async function rejectWithReason(page: Page, reason: string) {
  const diff = page.getByRole("region", { name: "index.html", exact: true });
  await diff.getByRole("button", { name: "Reject" }).click();
  await page.getByLabel("Why? (optional)").fill(reason);
  await page.getByRole("button", { name: "Reject edit" }).click();
}

test("nothing is recorded before consent", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: /Fix the broken link/ }).click();
  await expect(status(page)).toHaveText("Waiting for you");
  await rejectWithReason(page, "a private reason");
  expect(await stored(page)).toBeNull();
});

test("consent, a session, a rating and a download, with no typed text in the file", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Take part" }).click();
  const consent = page.getByRole("dialog", { name: "Take part in the study" });
  await expect(consent).toContainText("What isn't");
  await consent.getByRole("button", { name: "I agree, take part" }).click();
  expect(JSON.parse((await stored(page))!).participant).toMatch(/^p-[0-9a-f]{8}$/);

  await page.getByRole("button", { name: /Fix the broken link/ }).click();
  await expect(status(page)).toHaveText("Waiting for you");
  await page.locator("summary", { hasText: "Listed the files" }).click();
  await rejectWithReason(page, "secret words that must not be recorded");
  await expect(status(page)).toHaveText("Done");

  const rating = page.getByRole("region", { name: "How did that go?" });
  for (const statement of ["I felt in control", "I trusted the changes", "Working with it took little effort"]) {
    await rating.getByRole("radiogroup", { name: new RegExp(statement) }).getByRole("radio", { name: "4" }).click();
  }
  await rating.getByRole("button", { name: "Save answers" }).click();
  await expect(rating).toHaveCount(0);

  await page.getByRole("button", { name: /Study/ }).click();
  const panel = page.getByRole("dialog", { name: "The study" });
  await expect(panel).toContainText("1 session recorded, 1 rated, 0 suggestions.");
  await panel.getByLabel("Suggest a change").fill("Show which file each edit is in, at a glance.");
  await panel.getByRole("button", { name: "Save suggestion" }).click();
  await expect(panel).toContainText("1 suggestion.");

  const [download] = await Promise.all([page.waitForEvent("download"), panel.getByRole("button", { name: "Download my data" }).click()]);
  const text = readFileSync((await download.path())!, "utf8");
  const record = JSON.parse(text);
  const session = record.sessions[0];
  expect(session.task).toBe("broken-link");
  expect(session.outcome).toBe("done");
  expect(session.rating).toEqual({ control: 4, trust: 4, effort: 4 });
  const kinds = session.events.map((e: { kind: string }) => e.kind);
  expect(kinds).toEqual(expect.arrayContaining(["turn_start", "turn_end", "reject", "expand"]));
  const reject = session.events.find((e: { kind: string }) => e.kind === "reject");
  expect(reject.data).toMatchObject({ gaveReason: true, reasonLength: 38 });
  // The rejection's words are nowhere in the file; the suggestion, written for the study, is.
  expect(text).not.toContain("secret words");
  expect(record.suggestions[0].text).toBe("Show which file each edit is in, at a glance.");
});

test("leaving the study deletes everything it recorded", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.getByRole("button", { name: "Take part" }).click();
  await page.getByRole("button", { name: "I agree, take part" }).click();
  expect(await stored(page)).not.toBeNull();
  await page.getByRole("button", { name: /Study/ }).click();
  const panel = page.getByRole("dialog", { name: "The study" });
  await panel.getByRole("button", { name: "Leave the study…" }).click();
  await expect(panel.getByRole("alert")).toContainText("deletes everything");
  await panel.getByRole("button", { name: "Delete and leave" }).click();
  expect(await stored(page)).toBeNull();
  await expect(page.getByRole("button", { name: "Take part" })).toBeVisible();
  // The confirmation toast opened inside the dialog that then unmounted: no crash.
  await expect(page.getByRole("region", { name: "Notifications" })).toContainText("You've left the study");
  expect(errors).toEqual([]);
});
