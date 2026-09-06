// spec: specs/plan.md
// seed: drafts/seed.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Login Functionality", () => {
  test("Successful login with valid credentials", async ({ page }) => {
    // 1. Navigate to https://the-internet.herokuapp.com/login
    await page.goto("https://the-internet.herokuapp.com/login");

    const usernameInput = page.getByRole("textbox", { name: "Username" });
    const passwordInput = page.getByRole("textbox", { name: "Password" });
    const loginButton = page.getByRole("button", { name: " Login" });
    const flashMessage = page.locator("#flash");

    // expect: The Login Page is displayed with a 'Username' textbox, a 'Password' textbox, and a 'Login' button
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // expect: No flash message is shown
    await expect(flashMessage).not.toBeVisible();

    // 2. Enter 'tomsmith' into the Username field
    await usernameInput.fill("tomsmith");

    // expect: The Username field contains the value 'tomsmith'
    await expect(usernameInput).toHaveValue("tomsmith");

    // 3. Enter 'SuperSecretPassword!' into the Password field
    await passwordInput.fill("SuperSecretPassword!");

    // expect: The Password field contains the masked value
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveValue("SuperSecretPassword!");

    // 4. Click the 'Login' button
    await loginButton.click();

    // expect: The browser is redirected to https://the-internet.herokuapp.com/secure
    await expect(page).toHaveURL("https://the-internet.herokuapp.com/secure");

    // expect: A green success flash message containing 'You logged into a secure area!' is displayed
    await expect(flashMessage).toBeVisible();
    await expect(flashMessage).toContainText("You logged into a secure area!");
    await expect(flashMessage).toHaveClass(/success/);

    // expect: The 'Secure Area' heading is visible
    await expect(page.getByRole("heading", { name: "Secure Area", exact: true })).toBeVisible();

    // expect: A 'Logout' link is visible
    await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();

    // 5. Click the 'x' close icon on the flash message
    await page.getByRole("link", { name: "×" }).click();

    // expect: The flash message is dismissed and no longer visible
    await expect(flashMessage).not.toBeVisible();
  });
});
