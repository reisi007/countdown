import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial", timeout: 120000 });

test.describe("Numbers round — solo", () => {
  test("page loads with drawing phase", async ({ page }) => {
    await page.goto("/en-GB/solo/numbers");
    await expect(page.getByRole("heading", { name: "Numbers Round" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Large")).toBeVisible();
    await expect(page.locator("text=Small")).toBeVisible();
  });

  test("can draw all 6 tiles and start playing", async ({ page }) => {
    await page.goto("/en-GB/solo/numbers");

    for (let i = 0; i < 6; i++) {
      await page.click("text=Small");
      await page.waitForTimeout(200);
    }

    await expect(page.locator("button.btn-warning").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Small")).toHaveCount(0);
  });
});

test.describe("Numbers round — multiplayer", () => {
  test("two players enter a room and host starts numbers round", async ({ browser }) => {
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
    expect(roomId).toBeTruthy();

    await guestPage.goto(`/en-GB/room/${roomId}`);

    await expect(hostPage.locator("text=Players")).toBeVisible({ timeout: 15000 });
    await expect(guestPage.locator("text=Players")).toBeVisible({ timeout: 15000 });

    await hostPage.locator("button:has-text(\"Numbers\")").click();
    await expect(hostPage.locator("button:has-text(\"Start Numbers\")")).toBeVisible({ timeout: 8000 });

    await hostPage.locator("button:has-text(\"Start Numbers\")").click();

    await hostPage.waitForURL(/\/numbers$/, { timeout: 10000 });
    await guestPage.waitForURL(/\/numbers$/, { timeout: 10000 });
    await expect(hostPage.getByRole("heading", { name: "Numbers Round" })).toBeVisible();
    await expect(guestPage.getByRole("heading", { name: "Numbers Round" })).toBeVisible();

    await hostCtx.close();
    await guestCtx.close();
  });

  test("host draws numbers and target is shown to both players", async ({ browser }) => {
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

    const numbersBar = hostPage.locator("button:has-text(\"Numbers\")");
    await numbersBar.click();
    await expect(hostPage.locator("button:has-text(\"Start Numbers\")")).toBeVisible({ timeout: 8000 });

    const timerToggle = hostPage.locator("input.toggle");
    if ((await timerToggle.count()) > 0) {
      await timerToggle.click();
      await hostPage.waitForTimeout(300);
    }

    await hostPage.locator("button:has-text(\"Start Numbers\")").click();

    await hostPage.waitForURL(/\/numbers$/, { timeout: 10000 });
    await guestPage.waitForURL(/\/numbers$/, { timeout: 10000 });
    await expect(hostPage.getByRole("heading", { name: "Numbers Round" })).toBeVisible();
    await expect(guestPage.getByRole("heading", { name: "Numbers Round" })).toBeVisible();

    const smallBtn = hostPage.locator("button:has-text(\"Small\")");
    await expect(smallBtn).toBeVisible({ timeout: 10000 });
    for (let i = 0; i < 6; i++) {
      await smallBtn.click();
      await hostPage.waitForTimeout(200);
    }

    await expect(hostPage.locator("text=No timer")).toBeVisible({ timeout: 8000 });
    await expect(guestPage.locator("text=No timer")).toBeVisible({ timeout: 15000 });

    await hostCtx.close();
    await guestCtx.close();
  });
});
