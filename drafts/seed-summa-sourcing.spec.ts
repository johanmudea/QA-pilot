import { test } from "@playwright/test";
import { env } from "../config/env";

test.describe("Summa Network app - Sourcing", () => {
  test("seed", async ({ page }) => {
    await page.goto(env.summaSourcing.url!);
    // generate code here.
  });
});
