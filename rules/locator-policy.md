# Locator Policy

## Where locators live

A locator (a CSS selector, an id, a role query) is written in **exactly one place**:
inside the Page Object or Component that owns the element. It never appears in a
step definition, a fixture, or a feature file.

```ts
// pages/LoginPage.ts — correct: locator lives here, wrapped in a named action
async enterUsername(username: string): Promise<void> {
  await this.page.getByRole("textbox", { name: "Username" }).fill(username);
}
```

```ts
// steps/login.steps.ts — correct: step calls the action, never sees the selector
When("the user enters an invalid username", async function (this: QaWorld) {
  await loginPage(this).enterUsername("invalid_user");
});
```

If the same element needs a different interaction elsewhere, add a method to the Page
Object/Component — do not reach into the page from a step to re-query the element.

## Selector priority (highest to lowest)

1. **Role/accessible name** — `page.getByRole("button", { name: "Login" })` — resilient
   to markup and styling changes, matches how the doc's Explorer agent reads the
   accessibility tree.
2. **Test id** — `page.getByTestId("login-submit")` — when the app exposes one.
3. **Stable semantic attribute** — `#id`, `name="..."` — acceptable when the id is part
   of the application's contract and no accessible role/name exists (e.g. `#flash` in
   `components/FlashMessage.ts` — a banner `div`, not a labeled control).
4. **CSS class** — only when nothing above is available, and only if the class is
   structural (`.flash.error`), not a styling utility class that a designer could rename
   without changing behavior.
5. **XPath / text matching / nth-child** — last resort. If a change requires one of
   these, flag it — it usually means the application needs a test id, not a cleverer
   selector.

## Rules

1. **One element, one locator.** If the same element is queried with two different
   selectors in two places, that is a defect — consolidate into one Page Object method.
2. **No implicit waits.** Do not add `page.waitForTimeout(...)`. Use Playwright's
   auto-waiting (`fill`, `click`, `isVisible`) or an explicit
   `page.waitForSelector`/`locator.waitFor` tied to a real condition.
3. **Assertions read state through the Page Object, not through raw locators in the
   step.** A step calls `loginPage.getErrorMessage()` or
   `loginPage.isErrorMessageVisible()` — it does not call `page.textContent("#flash")`
   itself.
4. **Components own their own locators.** A `Header` or `Modal` component exposes
   methods (`header.openUserMenu()`), and the Page Object composes the component
   instead of duplicating its selectors — e.g. `components/FlashMessage.ts` is used
   by both `LoginPage` and `SecurePage` via a `flashMessage` property, instead of each
   page re-implementing `#flash` handling.
