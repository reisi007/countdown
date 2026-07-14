import { test, expect } from "@playwright/test";

test.describe("Multiplayer flow", () => {
  test("two players can join a room", async ({ browser }) => {
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    await player1Page.goto("/en-GB");
    await player1Page.click("text=Multiplayer");

    const roomUrl = player1Page.url();
    expect(roomUrl).toContain("/room/");

    const roomId = roomUrl.split("/room/")[1];

    await player2Page.goto(`/en-GB/room/${roomId}`);

    await expect(player1Page.locator("text=Players")).toBeVisible({ timeout: 10000 });
    await expect(player2Page.locator("text=Players")).toBeVisible({ timeout: 10000 });

    await player1Context.close();
    await player2Context.close();
  });

  test("host failover when host disconnects", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const clientContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const clientPage = await clientContext.newPage();

    await hostPage.goto("/en-GB");
    await hostPage.click("text=Multiplayer");
    const roomUrl = hostPage.url();
    const roomId = roomUrl.split("/room/")[1];

    await clientPage.goto(`/en-GB/room/${roomId}`);
    await expect(clientPage.locator("text=Players")).toBeVisible({ timeout: 10000 });

    await hostPage.close();
    await hostContext.close();

    await expect(clientPage.locator("text=host")).toBeVisible({ timeout: 5000 });

    await clientContext.close();
  });

  test("solo letters round page loads", async ({ page }) => {
    await page.goto("/en-GB/solo/letters");
    await expect(page.locator("text=Vowel")).toBeVisible();
    await expect(page.locator("text=Consonant")).toBeVisible();
  });

  test("solo numbers round page loads", async ({ page }) => {
    await page.goto("/en-GB/solo/numbers");
    await expect(page.locator("text=Large")).toBeVisible();
    await expect(page.locator("text=Small")).toBeVisible();
  });

  test("locale redirect works", async ({ page }) => {
    await page.goto("/");
    const url = page.url();
    expect(url).toMatch(/\/en-GB|\/de|\/en-US/);
  });

  test("main menu has navigation options", async ({ page }) => {
    await page.goto("/en-GB");
    await expect(page.locator("text=Solo Play")).toBeVisible();
    await expect(page.locator("text=Multiplayer")).toBeVisible();
    await expect(page.locator("text=Countdown")).toBeVisible();
  });
});
