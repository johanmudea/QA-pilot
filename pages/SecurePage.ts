import { Page } from "playwright";
import { FlashMessage } from "@components/FlashMessage";
import { BasePage } from "./BasePage";

export class SecurePage extends BasePage {
  readonly flashMessage: FlashMessage;

  constructor(page: Page) {
    super(page);
    this.flashMessage = new FlashMessage(page);
  }

  async isDisplayed(): Promise<boolean> {
    return this.page.getByRole("heading", { name: "Secure Area", exact: true }).isVisible();
  }

  async isLogoutLinkVisible(): Promise<boolean> {
    return this.page.getByRole("link", { name: "Logout" }).isVisible();
  }

  async logout(): Promise<void> {
    await this.page.getByRole("link", { name: "Logout" }).click();
  }
}
