import { test, expect } from "@playwright/test";

test.describe("legal pages", () => {
  test("impressum is reachable from the footer and shows the mandatory data", async ({
    page,
  }) => {
    await page.goto("/en-GB");
    await page.getByRole("link", { name: "Impressum" }).click();

    await expect(page).toHaveURL(/\/de\/impressum/);
    await expect(page.getByRole("heading", { name: "Impressum" })).toBeVisible();
    await expect(page.getByText("Florian Reisinger").first()).toBeVisible();
    await expect(page.getByText("Robert-Stolz-Straße 8", { exact: true })).toBeVisible();
    await expect(page.getByText("4020 Linz", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "hello@all-the.rest" }),
    ).toBeVisible();
  });

  test("footer links to the external privacy policy", async ({ page }) => {
    await page.goto("/en-GB");
    const privacy = page.getByRole("link", { name: "Datenschutz" });
    await expect(privacy).toHaveAttribute("href", "https://all-the.rest/datenschutz");
  });
});
