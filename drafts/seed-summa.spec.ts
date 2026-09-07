import { test } from "@playwright/test";
import { env } from "../config/env";

test.describe("Summa Network app - Providers", () => {
  test("seed", async ({ page }) => {
    await page.goto(env.summaProviders.url!);
    // generate code here.
  });
});
