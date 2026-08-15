// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import type { ReactNode } from "react";
import SoloConundrumPage from "@/app/[locale]/solo/conundrum/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en-GB" }),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: (props: { href: string; children?: ReactNode; className?: string }) =>
      React.createElement("a", { href: props.href, className: props.className }, props.children),
  };
});

const SCRAMBLED = "NARVDEUTE";

function mockFetchOnce() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      answer: "ADVENTURE",
      scrambled: SCRAMBLED,
      timeRemaining: 30,
    }),
  });
}

function tileText(): string {
  return Array.from(document.querySelectorAll("kbd"))
    .map((k) => k.textContent ?? "")
    .join("");
}

describe("SoloConundrumPage — round stability (React Compiler regression)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchOnce());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("loads exactly one round and never re-fetches while idle", async () => {
    render(<SoloConundrumPage />);

    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(tileText()).toBe(SCRAMBLED);
    });

    await new Promise((r) => setTimeout(r, 300));

    expect(tileText()).toBe(SCRAMBLED);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not reset the round or the guess while typing", async () => {
    render(<SoloConundrumPage />);

    fireEvent.click(screen.getByText("Start"));

    await waitFor(() => {
      expect(tileText()).toBe(SCRAMBLED);
    });

    const input = screen.getByPlaceholderText("Type the answer...");
    fireEvent.change(input, { target: { value: "ADV" } });
    fireEvent.change(input, { target: { value: "ADVENT" } });
    await new Promise((r) => setTimeout(r, 200));

    expect((input as HTMLInputElement).value).toBe("ADVENT");
    expect(tileText()).toBe(SCRAMBLED);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("counts down when the timer is enabled", async () => {
    vi.useFakeTimers();
    render(<SoloConundrumPage />);

    fireEvent.click(screen.getByLabelText("Timer"));
    fireEvent.click(screen.getByText("Start"));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const progress = screen.getByRole("progressbar");
    expect(progress.textContent).toBe("30");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(progress.textContent).toBe("28");
  });
});
