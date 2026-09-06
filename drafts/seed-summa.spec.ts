import { test } from "@playwright/test";
import { env } from "../config/env";

test.describe("Summa Network app", () => {
  test("seed", async ({ page }) => {
    await page.goto(env.summaApp.url!);
    // generate code here.
  });
});
