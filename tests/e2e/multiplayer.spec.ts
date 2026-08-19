import { test, expect } from "@playwright/test";

test.describe("Multiplayer flow", () => {
  test("two players can join a room", async ({ browser }) => {
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    await player1Page.goto("/en-GB");
    await player1Page.click("text=Multiplayer");
    await player1Page.waitForURL(
      (url) => url.pathname.includes("/room/") && !url.pathname.endsWith("/room/new"),
    );

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
    await hostPage.waitForURL(
      (url) => url.pathname.includes("/room/") && !url.pathname.endsWith("/room/new"),
    );
    const roomUrl = hostPage.url();
    const roomId = roomUrl.split("/room/")[1];

    await clientPage.goto(`/en-GB/room/${roomId}`);
    await expect(clientPage.locator("text=Players")).toBeVisible({ timeout: 10000 });

    await hostPage.close();
    await hostContext.close();

    await expect(clientPage.getByText("You are the host")).toBeVisible({ timeout: 5000 });

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

  test("solo conundrum round loads once and stays stable", async ({ page }) => {
    await page.goto("/en-GB/solo/conundrum");
    await page.locator("input.toggle").click();
    await page.locator("button:has-text(\"Start\")").click();

    const tiles = page.locator("kbd.border-warning");
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    const first = await tiles.allTextContents();

    await page.waitForTimeout(2000);
    expect(await tiles.allTextContents()).toEqual(first);

    await page.locator("input.text-center").first().fill("ADV");
    await page.waitForTimeout(500);
    expect(await tiles.allTextContents()).toEqual(first);
    await expect(page.locator("input.text-center").first()).toHaveValue("ADV");
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

test.describe("Multiplayer round navigation", () => {
  test("host starts a letters round and Vowel/Consonant controls render", async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const guestCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await hostPage.goto("/en-GB");
    await hostPage.click("text=Multiplayer");
    await hostPage.waitForURL(
      (url) => url.pathname.includes("/room/") && !url.pathname.endsWith("/room/new"),
    );

    const roomUrl = hostPage.url();
    const roomId = roomUrl.split("/room/")[1];

    await guestPage.goto(`/en-GB/room/${roomId}`);

    await expect(hostPage.locator("text=Players")).toBeVisible({ timeout: 15000 });
    await expect(guestPage.locator("text=Players")).toBeVisible({ timeout: 15000 });

    await expect(hostPage.locator("button:has-text(\"Start Letters\")")).toBeVisible({ timeout: 8000 });
    await hostPage.locator("button:has-text(\"Start Letters\")").click();

    await hostPage.waitForURL(/\/letters$/, { timeout: 10000 });
    await guestPage.waitForURL(/\/letters$/, { timeout: 10000 });
    await expect(hostPage.getByRole("heading", { name: "Letters Round" })).toBeVisible();
    await expect(guestPage.getByRole("heading", { name: "Letters Round" })).toBeVisible();

    await expect(hostPage.locator("text=Vowel")).toBeVisible({ timeout: 10000 });
    await expect(hostPage.locator("text=Consonant")).toBeVisible({ timeout: 10000 });

    await hostCtx.close();
    await guestCtx.close();
  });

  test("host starts a conundrum round and scrambled tiles auto-appear", async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const guestCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await hostPage.goto("/en-GB");
    await hostPage.click("text=Multiplayer");
    await hostPage.waitForURL(
      (url) => url.pathname.includes("/room/") && !url.pathname.endsWith("/room/new"),
    );

    const roomUrl = hostPage.url();
    const roomId = roomUrl.split("/room/")[1];

    await guestPage.goto(`/en-GB/room/${roomId}`);

    await expect(hostPage.locator("text=Players")).toBeVisible({ timeout: 15000 });
    await expect(guestPage.locator("text=Players")).toBeVisible({ timeout: 15000 });

    await hostPage.locator("button:has-text(\"Conundrum\")").click();
    await expect(hostPage.locator("button:has-text(\"Start Conundrum\")")).toBeVisible({ timeout: 8000 });
    await hostPage.locator("button:has-text(\"Start Conundrum\")").click();

    await hostPage.waitForURL(/\/conundrum$/, { timeout: 10000 });
    await guestPage.waitForURL(/\/conundrum$/, { timeout: 10000 });
    await expect(hostPage.locator("h1", { hasText: "Conundrum" })).toBeVisible();

    const tiles = hostPage.locator("kbd.border-warning");
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    const first = await tiles.allTextContents();
    expect(first.length).toBeGreaterThan(0);

    await hostPage.waitForTimeout(1500);
    expect(await tiles.allTextContents()).toEqual(first);

    await hostCtx.close();
    await guestCtx.close();
  });
});
