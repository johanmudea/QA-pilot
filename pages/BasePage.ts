import { Page } from "playwright";

/** Shared base for every Page Object — see rules/architecture.md. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
}
