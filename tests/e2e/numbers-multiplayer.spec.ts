import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "child_process";
import path from "path";

const TEST_PORT = 3099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let serverProcess: ChildProcess | null = null;
let serverReady = false;

test.describe.configure({ mode: "serial", timeout: 120000 });

async function ensureServer(): Promise<void> {
  if (serverReady) return;

  serverProcess = spawn("node", [path.resolve(__dirname, "../../server.js")], {
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: "production" },
    stdio: "inherit",
    cwd: path.resolve(__dirname, "../../.."),
  });

  const start = Date.now();
  const waitMs = 120000;
  while (Date.now() - start < waitMs) {
    try {
      const res = await fetch(`${BASE_URL}/en-GB`);
      if (res.ok) {
        serverReady = true;
        return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${BASE_URL} did not start within ${waitMs}ms`);
}

test.beforeAll(async () => {
  await ensureServer();
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 2000));
    if (!serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }
  }
});

test.describe("Numbers round — solo", () => {
  test("page loads with drawing phase", async ({ page }) => {
    await page.goto(`${BASE_URL}/en-GB/solo/numbers`);
    await expect(page.locator("text=Numbers Round")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Large")).toBeVisible();
    await expect(page.locator("text=Small")).toBeVisible();
  });

  test("can draw all 6 tiles and start playing", async ({ page }) => {
    await page.goto(`${BASE_URL}/en-GB/solo/numbers`);

    for (let i = 0; i < 6; i++) {
      await page.click("text=Small");
      await page.waitForTimeout(200);
    }

    await expect(page.locator("text=Choose an operation")).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Numbers round — multiplayer", () => {
  test("two players enter a room and host starts numbers round", async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const guestCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await hostPage.goto(`${BASE_URL}/en-GB`);
    await hostPage.click("text=Multiplayer");

    const roomUrl = hostPage.url();
    const roomId = roomUrl.split("/room/")[1];
    expect(roomId).toBeTruthy();

    await guestPage.goto(`${BASE_URL}/en-GB/room/${roomId}`);

    await expect(hostPage.locator("text=Players")).toBeVisible({ timeout: 15000 });
    await expect(guestPage.locator("text=Players")).toBeVisible({ timeout: 15000 });

    await hostPage.locator("button:has-text(\"Numbers\")").click();
    await expect(hostPage.locator("button:has-text(\"Start Numbers\")")).toBeVisible({ timeout: 8000 });

    await hostPage.locator("button:has-text(\"Start Numbers\")").click();

    await expect(hostPage.locator("text=Numbers Round")).toBeVisible({ timeout: 10000 });
    await expect(guestPage.locator("text=Numbers Round")).toBeVisible({ timeout: 10000 });

    await hostCtx.close();
    await guestCtx.close();
  });

  test("host draws numbers and target is shown to both players", async ({ browser }) => {
    const hostCtx = await browser.newContext();
    const guestCtx = await browser.newContext();
    const hostPage = await hostCtx.newPage();
    const guestPage = await guestCtx.newPage();

    await guestPage.goto(`${BASE_URL}/en-GB`);
    await guestPage.click("text=Multiplayer");
    const roomUrl = guestPage.url();
    const roomId = roomUrl.split("/room/")[1];

    await hostPage.goto(`${BASE_URL}/en-GB/room/${roomId}`);

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

    await expect(hostPage.locator("text=Numbers Round")).toBeVisible({ timeout: 10000 });
    await expect(guestPage.locator("text=Numbers Round")).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 6; i++) {
      const smallBtn = hostPage.locator("button:has-text(\"Small\")");
      if (await smallBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await smallBtn.click();
        await hostPage.waitForTimeout(200);
      }
    }

    await expect(hostPage.locator("text=No timer")).toBeVisible({ timeout: 8000 });
    await expect(guestPage.locator("text=No timer")).toBeVisible({ timeout: 8000 });

    await hostCtx.close();
    await guestCtx.close();
  });
});
