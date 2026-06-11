import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env.local") });

const frontendUrl = process.env.E2E_FRONTEND_URL ?? "http://localhost:3000";
const backendUrl = process.env.E2E_BACKEND_URL ?? "http://localhost:5233";

const connectionString =
  process.env.E2E_CONNECTION_STRING ??
  process.env.ConnectionStrings__DefaultConnection;

if (!connectionString) {
  throw new Error(
    "E2E_CONNECTION_STRING is not set. Copy e2e/.env.example to e2e/.env.local and add your database connection string."
  );
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "dotnet run --project ../backend/HabitHub.Api/HabitHub.Api.csproj --no-launch-profile --urls http://localhost:5233",
      cwd: __dirname,
      url: `${backendUrl}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ASPNETCORE_ENVIRONMENT: "E2E",
        ConnectionStrings__DefaultConnection: connectionString,
      },
    },
    {
      command: "npm run dev -- --port 3000",
      cwd: `${__dirname}/../frontend`,
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_BASE_URL: backendUrl,
      },
    },
  ],
});
