import { Page } from "playwright";
import { env } from "../config/env";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(`${env.baseUrl}/login`);
  }

  async enterUsername(username: string): Promise<void> {
    await this.page.fill("#username", username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.page.fill("#password", password);
  }

  async submit(): Promise<void> {
    await this.page.click("button[type='submit']");
  }

  async getErrorMessage(): Promise<string> {
    const text = await this.page.textContent("#flash");
    return (text ?? "").trim();
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return this.page.isVisible("#flash.error");
  }
}
