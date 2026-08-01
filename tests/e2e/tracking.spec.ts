import { test, expect, Page } from "@playwright/test";

type TrackedEvent = { name: string; payload?: unknown };

async function stubTracker(page: Page) {
  await page.route("**/x7k2p.js", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    }),
  );
  await page.addInitScript(() => {
    const w = window as unknown as {
      __trackedEvents: TrackedEvent[];
      trackEvent?: (name: string, payload?: unknown) => void;
    };
    w.__trackedEvents = [];
    w.trackEvent = (name, payload) => {
      w.__trackedEvents.push({ name, payload });
    };
  });
}

async function trackedEvents(page: Page): Promise<TrackedEvent[]> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __trackedEvents: TrackedEvent[];
        }
      ).__trackedEvents,
  );
}

async function expectEvent(page: Page, name: string) {
  await expect
    .poll(async () => (await trackedEvents(page)).map((e) => e.name), {
      timeout: 15000,
    })
    .toContain(name);
}

test.describe("tracking events", () => {
  test("solo letters sends game_start with letter breakdown", async ({ page }) => {
    await stubTracker(page);
    await page.goto("/en-GB/solo/letters");

    const vowel = page.getByRole("button", { name: "Vowel" });
    const consonant = page.getByRole("button", { name: "Consonant" });
    for (let i = 0; i < 9; i++) {
      if (await vowel.isEnabled()) await vowel.click();
      else await consonant.click();
    }

    await expect(page.getByRole("button", { name: "Finish round" })).toBeVisible();
    await expectEvent(page, "game_start");

    const gs = (await trackedEvents(page)).find((e) => e.name === "game_start");
    expect(gs).toBeDefined();
    const p = gs!.payload as {
      mode: string;
      type: string;
      locale: string;
      vowels: number;
      consonants: number;
    };
    expect(p.mode).toBe("solo");
    expect(p.type).toBe("letters");
    expect(p.locale).toBe("en-GB");
    expect(p.vowels + p.consonants).toBe(9);
  });

  test("solo letters round completion sends word_submit and round_complete", async ({ page }) => {
    await stubTracker(page);
    await page.goto("/en-GB/solo/letters");

    const vowel = page.getByRole("button", { name: "Vowel" });
    const consonant = page.getByRole("button", { name: "Consonant" });
    for (let i = 0; i < 9; i++) {
      if (await vowel.isEnabled()) await vowel.click();
      else await consonant.click();
    }

    await page.getByPlaceholder("Type your word...").fill("AAA");
    await page.getByRole("button", { name: "Submit" }).click();
    await expectEvent(page, "word_submit");

    await page.getByRole("button", { name: "Finish round" }).click();
    await expectEvent(page, "round_complete");

    const all = await trackedEvents(page);
    const ws = all.find((e) => e.name === "word_submit");
    expect(ws!.payload).toMatchObject({
      mode: "solo",
      type: "letters",
      locale: "en-GB",
      length: 3,
    });
    const rc = all.find((e) => e.name === "round_complete");
    expect(rc!.payload).toMatchObject({ mode: "solo", type: "letters", locale: "en-GB" });
  });

  test("solo numbers sends game_start with number breakdown", async ({ page }) => {
    await stubTracker(page);
    await page.goto("/en-GB/solo/numbers");

    const large = page.getByRole("button", { name: "Large" });
    const small = page.getByRole("button", { name: "Small" });
    for (let i = 0; i < 6; i++) {
      if (await large.isEnabled()) await large.click();
      else await small.click();
    }

    await expectEvent(page, "game_start");
    const gs = (await trackedEvents(page)).find((e) => e.name === "game_start");
    expect(gs).toBeDefined();
    const p = gs!.payload as {
      mode: string;
      type: string;
      locale: string;
      large: number;
      small: number;
    };
    expect(p.mode).toBe("solo");
    expect(p.type).toBe("numbers");
    expect(p.locale).toBe("en-GB");
    expect(p.large + p.small).toBe(6);
  });

  test("multiplayer lobby sends room_join", async ({ page }) => {
    await stubTracker(page);
    await page.goto("/en-GB");
    await page.getByRole("link", { name: "Multiplayer" }).click();

    await expect(page).toHaveURL(/\/room\//);
    await expectEvent(page, "room_join");

    const ev = (await trackedEvents(page)).find((e) => e.name === "room_join");
    expect(ev!.payload).toMatchObject({ mode: "multi", locale: "en-GB" });
  });
});
