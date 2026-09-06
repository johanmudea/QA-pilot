import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import { QaWorld } from "@fixtures/world";
import { LoginPage, SecurePage } from "@pages";

function loginPage(world: QaWorld): LoginPage {
  return new LoginPage(world.page);
}

function securePage(world: QaWorld): SecurePage {
  return new SecurePage(world.page);
}

Given("the user is on the login page", async function (this: QaWorld) {
  await loginPage(this).goto();
});

When("the user enters an invalid username", async function (this: QaWorld) {
  await loginPage(this).enterUsername("invalid_user");
});

When("the user enters a valid username", async function (this: QaWorld) {
  await loginPage(this).enterUsername("tomsmith");
});

When("the user enters an invalid password", async function (this: QaWorld) {
  await loginPage(this).enterPassword("invalid_password");
});

When("the user enters a valid password", async function (this: QaWorld) {
  await loginPage(this).enterPassword("SuperSecretPassword!");
});

When("the user submits the login form", async function (this: QaWorld) {
  await loginPage(this).submit();
});

Then("the login error message should be displayed", async function (this: QaWorld) {
  const visible = await loginPage(this).isErrorMessageVisible();
  assert.equal(visible, true);
});

Then("the user should be redirected to the secure area", async function (this: QaWorld) {
  const displayed = await securePage(this).isDisplayed();
  assert.equal(displayed, true);
});

Then("the success message should be displayed", async function (this: QaWorld) {
  const visible = await securePage(this).flashMessage.isSuccess();
  assert.equal(visible, true);
});
