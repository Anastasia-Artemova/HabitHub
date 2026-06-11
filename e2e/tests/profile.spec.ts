import { test, expect } from "@playwright/test";
import { createTestUser } from "../fixtures/test-user";
import { loginUser, registerUser } from "../fixtures/auth";

test.describe("Profile", () => {
  test("updates the username from the profile page", async ({ page }) => {
    const user = createTestUser("profile");
    const updatedUsername = `${user.username}_updated`;

    await registerUser(page, user);
    await page.goto("/profile");

    await expect(page.getByRole("heading", { name: "My Profile" })).toBeVisible();
    await page.getByRole("button", { name: "Edit profile details" }).click();
    await page.getByPlaceholder("Your username").fill(updatedUsername);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Profile updated successfully")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: updatedUsername })).toBeVisible();

    await page.goto("/logout");
    await loginUser(page, { ...user, username: updatedUsername });
    await page.goto("/profile");
    await expect(page.getByRole("heading", { level: 2, name: updatedUsername })).toBeVisible();
  });

  test("changes the account password", async ({ page }) => {
    const user = createTestUser("password");
    const newPassword = "NewSecurePassword456!";

    await registerUser(page, user);
    await page.goto("/profile");

    await page.getByRole("button", { name: "Change password" }).click();
    await page.getByPlaceholder("••••••••").nth(0).fill(user.password);
    await page.getByPlaceholder("••••••••").nth(1).fill(newPassword);
    await page.getByPlaceholder("••••••••").nth(2).fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();

    await expect(page.getByText("Password changed successfully")).toBeVisible();

    await page.goto("/logout");
    await loginUser(page, { ...user, password: newPassword });
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
