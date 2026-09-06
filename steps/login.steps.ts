import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import { QaWorld } from "../fixtures/world";
import { LoginPage } from "../pages/LoginPage";

function loginPage(world: QaWorld): LoginPage {
  return new LoginPage(world.page);
}

Given("the user is on the login page", async function (this: QaWorld) {
  await loginPage(this).goto();
});

When("the user enters an invalid username", async function (this: QaWorld) {
  await loginPage(this).enterUsername("invalid_user");
});

When("the user enters an invalid password", async function (this: QaWorld) {
  await loginPage(this).enterPassword("invalid_password");
});

When("the user submits the login form", async function (this: QaWorld) {
  await loginPage(this).submit();
});

Then("the login error message should be displayed", async function (this: QaWorld) {
  const visible = await loginPage(this).isErrorMessageVisible();
  assert.equal(visible, true);
});
