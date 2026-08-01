import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type TrackEvent = (
  name: string,
  payload?: Record<string, string | number | boolean | null | undefined>,
) => void;

type CapturedEvent = { name: string; payload?: unknown };

let trackEvent: TrackEvent;
const captured: CapturedEvent[] = [];

function setWindowWithTracker(fn?: (name: string, payload?: unknown) => void) {
  (globalThis as unknown as { window: unknown }).window = {
    trackEvent: fn,
  };
}

beforeEach(async () => {
  captured.length = 0;
  vi.resetModules();
  vi.useFakeTimers();
  const mod = await import("@/lib/tracking");
  trackEvent = mod.trackEvent;
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("trackEvent", () => {
  it("is a no-op when window is undefined (SSR / node)", () => {
    expect(() => trackEvent("game_start", { mode: "solo" })).not.toThrow();
    expect(captured).toHaveLength(0);
  });

  it("flushes immediately when the tracker is already loaded", () => {
    setWindowWithTracker((name, payload) => captured.push({ name, payload }));

    trackEvent("game_start", { mode: "solo", type: "letters" });
    trackEvent("round_complete", { mode: "solo", type: "letters" });

    expect(captured).toEqual([
      { name: "game_start", payload: { mode: "solo", type: "letters" } },
      { name: "round_complete", payload: { mode: "solo", type: "letters" } },
    ]);
  });

  it("buffers events until the tracker script loads, then flushes in order", () => {
    setWindowWithTracker(undefined);

    trackEvent("a", { n: 1 });
    trackEvent("b", { n: 2 });
    expect(captured).toHaveLength(0);

    setWindowWithTracker((name, payload) => captured.push({ name, payload }));
    vi.advanceTimersByTime(300);

    expect(captured).toEqual([
      { name: "a", payload: { n: 1 } },
      { name: "b", payload: { n: 2 } },
    ]);
  });

  it("keeps buffering while the tracker stays unavailable", () => {
    setWindowWithTracker(undefined);

    trackEvent("a");
    vi.advanceTimersByTime(5000);

    expect(captured).toHaveLength(0);
  });

  it("does not stop delivering events after the tracker throws", () => {
    let callCount = 0;
    setWindowWithTracker((name, payload) => {
      callCount++;
      if (callCount === 1) throw new Error("boom");
      captured.push({ name, payload });
    });

    expect(() => trackEvent("a")).not.toThrow();
    trackEvent("b");

    expect(captured).toEqual([{ name: "b", payload: undefined }]);
  });
});
