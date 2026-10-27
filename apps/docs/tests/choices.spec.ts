import { expect, test } from "@playwright/test";
import { open } from "./open";

test.describe("Checkbox", () => {
  test.beforeEach(async ({ page }) => open(page, "/components/checkbox"));

  test("the label and Space toggle it; select-all shows a mixed state", async ({ page }) => {
    const all = page.getByRole("checkbox", { name: "All files" });
    const readme = page.getByRole("checkbox", { name: "README.md" });
    // One of three files is picked to start with.
    await expect(all).toBeChecked({ indeterminate: true });

    await page.getByText("README.md", { exact: true }).click();
    await expect(readme).toBeChecked();
    await expect(all).toBeChecked({ indeterminate: true });

    await page.getByRole("checkbox", { name: "index.html" }).focus();
    await page.keyboard.press("Space");
    await expect(all).toBeChecked();
    await expect(all).toBeChecked({ indeterminate: false });

    await all.click();
    for (const name of ["index.html", "styles.css", "README.md"]) {
      await expect(page.getByRole("checkbox", { name })).not.toBeChecked();
    }
  });

  test("hint and error are read with the checkbox", async ({ page }) => {
    await expect(page.getByRole("checkbox", { name: "Send me a summary when a task finishes" })).toHaveAccessibleDescription(
      "One email per task, never more.",
    );
    const policy = page.getByRole("checkbox", { name: "I've read the data policy" });
    await expect(policy).toHaveAttribute("aria-invalid", "true");
    await expect(policy).toHaveAccessibleDescription("Agree to the policy to continue.");
    await expect(page.getByRole("checkbox", { name: "Share sessions with the team" })).toBeDisabled();
  });

  test("the check draws in, and simply appears with reduced motion", async ({ page }) => {
    const readme = page.getByRole("checkbox", { name: "README.md" });
    const check = readme.locator("xpath=following-sibling::*[1]").locator("path").first();
    // The suite runs with reduced motion on; turn it off to see the motion itself.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await readme.check();
    expect(await check.evaluate((p) => getComputedStyle(p).transitionDuration)).not.toBe("0s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await check.evaluate((p) => getComputedStyle(p).transitionDuration)).toBe("0s");
  });
});

test.describe("Switch", () => {
  test.beforeEach(async ({ page }) => open(page, "/components/switch"));

  test("is announced as a switch, and Space turns it on and off", async ({ page }) => {
    const auto = page.getByRole("switch", { name: "Apply edits automatically" });
    await expect(auto).not.toBeChecked();
    await expect(auto).toHaveAccessibleDescription("Each edit waits for your approval.");
    await auto.focus();
    await page.keyboard.press("Space");
    await expect(auto).toBeChecked();
    // The hint says what the new state means, and is read with it.
    await expect(auto).toHaveAccessibleDescription(/apply as the agent makes them/);
    await page.getByText("Apply edits automatically", { exact: true }).click();
    await expect(auto).not.toBeChecked();
    await expect(page.getByRole("switch", { name: "Live sessions" })).toBeDisabled();
  });

  test("the thumb moves to the end of the track, mirrored in right-to-left text", async ({ page }) => {
    const reads = page.getByRole("switch", { name: "Show the agent's reads and searches" });
    const thumb = reads.locator("xpath=following-sibling::*[1]");
    const gap = async () => {
      await thumb.evaluate((t) => Promise.all(t.getAnimations().map((a) => a.finished)));
      const [track, knob] = [await reads.boundingBox(), await thumb.boundingBox()];
      return { start: knob!.x - track!.x, end: track!.x + track!.width - (knob!.x + knob!.width) };
    };
    // On: the thumb sits at the inline end.
    expect((await gap()).end).toBeLessThan((await gap()).start);
    await page.locator(".example-preview").first().evaluate((el) => el.setAttribute("dir", "rtl"));
    expect((await gap()).start).toBeLessThan((await gap()).end);
  });
});

test.describe("RadioGroup", () => {
  test.beforeEach(async ({ page }) => open(page, "/components/radio-group"));

  test("is a named group; arrows select, Tab enters on the selected option", async ({ page, browserName }) => {
    const group = page.getByRole("group", { name: "When should edits need you?" });
    await expect(group).toBeVisible();
    const each = group.getByRole("radio", { name: "Approve each edit" });
    await expect(each).toBeChecked();
    await expect(each).toHaveAccessibleDescription("Every change waits, as a diff.");

    await each.focus();
    await page.keyboard.press("ArrowDown");
    await expect(group.getByRole("radio", { name: "Review at the end" })).toBeChecked();
    await expect(page.getByText("Selected: end")).toBeVisible();
    await page.keyboard.press("ArrowUp");
    await expect(each).toBeChecked();
    // Native radios: Chrome and Firefox wrap from the last option to the first; Safari stops.
    test.skip(browserName === "webkit", "Safari's radios don't wrap");
    await page.keyboard.press("ArrowUp");
    await expect(group.getByRole("radio", { name: "Apply automatically" })).toBeChecked();
  });

  test("arrows skip a disabled option", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "the disabled option is last, and Safari's radios don't wrap past it");
    const group = page.getByRole("group", { name: "Preview size" });
    await expect(group.getByRole("radio", { name: "Wide" })).toBeDisabled();
    await group.getByRole("radio", { name: "Desktop" }).check();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Phone" })).toBeChecked();
  });

  test("required: submitting with no answer stops the form and shows the error", async ({ page }) => {
    const group = page.getByRole("group", { name: "Preview size" });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(group).toHaveAccessibleDescription("Choose a size to continue.");
    await expect(group.getByRole("radio", { name: "Phone" })).toHaveAttribute("aria-invalid", "true");
    await group.getByRole("radio", { name: "Tablet" }).check();
    await expect(group).not.toHaveAccessibleDescription("Choose a size to continue.");
  });
});
