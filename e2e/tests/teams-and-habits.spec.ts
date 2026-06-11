import { test, expect } from "@playwright/test";
import { createTestUser } from "../fixtures/test-user";
import { registerUser } from "../fixtures/auth";

test.describe("Teams and habits", () => {
  test("creates a team, adds a habit, and logs it from the dashboard", async ({ page }) => {
    const user = createTestUser("team");
    const teamName = `E2E Team ${Date.now()}`;
    const habitName = `Read daily ${Date.now()}`;

    await registerUser(page, user);

    await page.getByRole("link", { name: "Teams" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Teams" })).toBeVisible();

    await page.getByLabel("Team Name").fill(teamName);
    await page.getByRole("button", { name: "Create Team" }).click();
    await expect(page.getByRole("button", { name: new RegExp(teamName) })).toBeVisible();

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await page.getByPlaceholder("e.g. Read 10 pages").fill(habitName);
    await page.getByPlaceholder("e.g. 10").fill("1");
    await page.locator('input[type="date"]').fill(endDate.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Create Habit for Team" }).click();
    await expect(page.getByRole("heading", { level: 4, name: habitName })).toBeVisible();

    await page.getByRole("link", { name: "Home" }).click();
    await expect(page.getByRole("heading", { name: "Today's Goals" })).toBeVisible();
    await expect(page.getByText(habitName)).toBeVisible();

    const habitRow = page.locator("div").filter({ hasText: habitName }).first();
    await habitRow.getByRole("checkbox").click();

    await expect(page.getByRole("heading", { name: "Log habit" })).toBeVisible();
    await page.getByRole("button", { name: "Save log" }).click();

    await expect(page.getByText("Completed today")).toBeVisible();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  });

  test("generates an invite code and lets a second user join the team", async ({ browser }) => {
    const creator = createTestUser("creator");
    const joiner = createTestUser("joiner");
    const teamName = `Invite Team ${Date.now()}`;

    const creatorContext = await browser.newContext();
    const joinerContext = await browser.newContext();
    const creatorPage = await creatorContext.newPage();
    const joinerPage = await joinerContext.newPage();

    await registerUser(creatorPage, creator);

    await creatorPage.getByRole("link", { name: "Teams" }).click();
    await creatorPage.getByLabel("Team Name").fill(teamName);
    await creatorPage.getByRole("button", { name: "Create Team" }).click();
    await expect(creatorPage.getByRole("button", { name: new RegExp(teamName) })).toBeVisible();

    await creatorPage.getByRole("button", { name: "Generate Invite Code" }).click();
    const inviteCodeElement = creatorPage
      .locator("p")
      .filter({ hasText: /^[A-F0-9]{8}$/ })
      .first();
    await expect(inviteCodeElement).toBeVisible();
    const inviteCode = (await inviteCodeElement.textContent())!.trim();

    await registerUser(joinerPage, joiner);
    await joinerPage.getByRole("link", { name: "Teams" }).click();
    await joinerPage.getByLabel("Invite Code").fill(inviteCode!.trim());
    await joinerPage.getByRole("button", { name: "Join Team" }).click();

    await expect(joinerPage.getByRole("button", { name: new RegExp(teamName) })).toBeVisible();
    await expect(joinerPage.getByRole("heading", { name: creator.username })).toBeVisible();

    await creatorContext.close();
    await joinerContext.close();
  });
});
