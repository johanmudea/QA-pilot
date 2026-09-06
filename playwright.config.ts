import { defineConfig } from "@playwright/test";
import { env } from "./config/env";

/**
 * Config for the Playwright Agents (planner/generator/healer) MCP tools only.
 * The Cucumber+POM framework (cucumber.json) does not use this file.
 * See rules/playwright-agents-policy.md for how drafts/ relates to pages/steps/features/.
 */
export default defineConfig({
  testDir: "./drafts",
  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
  },
  reporter: [["list"], ["html", { outputFolder: "reports/playwright-agents", open: "never" }]],
});
