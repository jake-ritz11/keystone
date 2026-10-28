import { expect, test, type Page } from "@playwright/test";
import { turn } from "./turn";

const status = (page: Page) => page.getByRole("status").filter({ hasText: /Working|Waiting|Done|Stopped/ }).first();

async function open(page: Page) {
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

test("without an API key, live mode is offered but disabled, and the route says why", async ({ page, request }) => {
  const info = await (await request.get("/api/turn")).json();
  expect(info.live).toBe(false);
  const post = await request.post("/api/turn", { data: { variant: { planning: "act", approval: "each", visibility: "timeline" }, messages: [{ role: "user", content: "hi" }] } });
  expect(post.status()).toBe(503);
  expect((await post.json()).error).toMatch(/isn't configured/);

  await open(page);
  const live = page.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Live" });
  await expect(live).toHaveAttribute("aria-disabled", "true");
  await live.click({ force: true });
  await expect(page.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Replay" })).toHaveAttribute("aria-checked", "true");
});

test("live mode: the client streams turns from the route, runs tools, and sends results back", async ({ page }) => {
  const bodies: { messages: { role: string; content: unknown }[]; variant: unknown }[] = [];
  const turns = [
    turn(
      [
        { thinking: "Checking the nav links." },
        { tool: "update_plan", id: "toolu_a1", input: { steps: [{ title: "Fix the About link", status: "in_progress" }] } },
        { tool: "edit_file", id: "toolu_a2", input: { path: "index.html", old_text: '<a href="abuot.html">About</a>', new_text: '<a href="about.html">About</a>' } },
      ],
      "tool_use",
    ),
    turn([{ text: "Fixed the About link: it pointed to `abuot.html`." }], "end_turn"),
  ];
  await page.route("**/api/turn", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { live: true, model: "claude-opus-5-5" } });
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body: turns[bodies.length - 1] ?? "" });
  });

  await open(page);
  await page.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Live" }).click();
  await expect(page.getByText("Live · claude-opus-5-5")).toBeVisible();
  // In live mode every task is available, including ones without a replay.
  await expect(page.getByRole("button", { name: /Add a dark mode/ })).toBeEnabled();
  await page.getByRole("button", { name: /Fix the broken link/ }).click();

  await expect(status(page)).toHaveText("Waiting for you");
  await expect(page.getByText("Checking the nav links.")).toBeVisible();
  await page.getByRole("region", { name: "index.html", exact: true }).getByRole("button", { name: "Approve" }).click();
  await expect(status(page)).toHaveText("Done");

  // The second request carried the tool results, and the first assistant turn exactly as sent.
  expect(bodies).toHaveLength(2);
  const second = bodies[1]!.messages;
  expect(second.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  expect((second[1]!.content as { type: string }[])[0]!.type).toBe("thinking");
  const results = second[2]!.content as { type: string; tool_use_id: string; content: string }[];
  expect(results.map((r) => r.tool_use_id)).toEqual(["toolu_a1", "toolu_a2"]);
  expect(results[1]!.content).toMatch(/approved/);
  // The client never sends a system prompt: the server owns it.
  expect(Object.keys(bodies[0]!).sort()).toEqual(["messages", "variant"]);
});

test("live mode: a route error is shown, not thrown, with a way to start again", async ({ page }) => {
  let turns = 0;
  await page.route("**/api/turn", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { live: true, model: "claude-opus-5-5" } });
    turns++;
    return route.fulfill({ status: 429, json: { error: "Today's budget for live sessions is used up. Replays still work." } });
  });
  await open(page);
  await page.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Live" }).click();
  await page.getByRole("button", { name: /Fix the broken link/ }).click();
  await expect(status(page)).toHaveText("Stopped by an error");
  await expect(page.getByText("Today's budget for live sessions is used up.")).toBeVisible();
  // The next step is on screen, not only in the command menu.
  expect(turns).toBe(1);
  await page.getByRole("button", { name: "Restart this task" }).click();
  await expect.poll(() => turns).toBe(2);
  await expect(status(page)).toHaveText("Stopped by an error");
});
