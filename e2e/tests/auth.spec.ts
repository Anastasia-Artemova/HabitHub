import { test, expect } from "@playwright/test";
import { createTestUser } from "../fixtures/test-user";
import { loginUser, logoutUser, registerUser } from "../fixtures/auth";

test.describe("Authentication", () => {
  test("registers a new user and lands on the dashboard", async ({ page }) => {
    const user = createTestUser("register");
    await registerUser(page, user);
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Teams" })).toBeVisible();
  });

  test("logs in with valid credentials", async ({ page }) => {
    const user = createTestUser("login");
    await registerUser(page, user);

    await page.goto("/logout");
    await expect(page).toHaveURL(/\/login/);

    await loginUser(page, user);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("shows an error for invalid login credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@e2e.test");
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs out and clears the session", async ({ page }) => {
    const user = createTestUser("logout");
    await registerUser(page, user);

    await logoutUser(page);

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();
  });

  test("redirects unauthenticated users from home to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in to HabitHub" })).toBeVisible();
  });
});
