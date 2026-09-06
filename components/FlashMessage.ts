import { Page } from "playwright";

/**
 * The #flash banner appears on both the login page (error) and the secure area
 * (success) — a Component, not duplicated per-page logic. See rules/architecture.md
 * rule 2.
 */
export class FlashMessage {
  constructor(private readonly page: Page) {}

  private locator() {
    return this.page.locator("#flash");
  }

  async getText(): Promise<string> {
    return ((await this.locator().textContent()) ?? "").trim();
  }

  async isVisible(): Promise<boolean> {
    return this.locator().isVisible();
  }

  async isError(): Promise<boolean> {
    return this.page.locator("#flash.error").isVisible();
  }

  async isSuccess(): Promise<boolean> {
    return this.page.locator("#flash.success").isVisible();
  }

  async dismiss(): Promise<void> {
    await this.page.getByRole("link", { name: "×" }).click();
  }
}
