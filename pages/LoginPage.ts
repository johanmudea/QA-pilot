import { Page } from "playwright";
import { env } from "@config/env";
import { FlashMessage } from "@components/FlashMessage";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  readonly flashMessage: FlashMessage;

  constructor(page: Page) {
    super(page);
    this.flashMessage = new FlashMessage(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(`${env.baseUrl}/login`);
  }

  async enterUsername(username: string): Promise<void> {
    await this.page.getByRole("textbox", { name: "Username" }).fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.page.getByRole("textbox", { name: "Password" }).fill(password);
  }

  async submit(): Promise<void> {
    await this.page.getByRole("button", { name: "Login" }).click();
  }

  async getErrorMessage(): Promise<string> {
    return this.flashMessage.getText();
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return this.flashMessage.isError();
  }
}
