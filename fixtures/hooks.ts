import { Before, After, BeforeAll, AfterAll, Status } from "@cucumber/cucumber";
import { chromium, Browser } from "playwright";
import { env } from "../config/env";
import { logger } from "../helpers/logger";
import { QaWorld } from "./world";

let browser: Browser;

BeforeAll({ timeout: 60_000 }, async function () {
  browser = await chromium.launch({ headless: env.headless });
});

AfterAll(async function () {
  await browser.close();
});

Before(async function (this: QaWorld, { pickle }) {
  logger.info(`Starting scenario: ${pickle.name}`);
  this.browser = browser;
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

After(async function (this: QaWorld, { pickle, result }) {
  if (result?.status === Status.FAILED) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, "image/png");
    logger.error(`Scenario failed: ${pickle.name}`);
  } else {
    logger.info(`Scenario passed: ${pickle.name}`);
  }
  await this.context.close();
});
