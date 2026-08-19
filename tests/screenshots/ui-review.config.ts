// UI-review route manifest — the single source of truth for which pages get
// screenshotted and in which states. Edit this file to add/remove routes; the
// generic spec picks the changes up automatically.
//
// This project (Countdown) has no auth and no multi-tenant setup, so the
// harness is simplified: every route is reached via UI clicks (the `nav`
// steps) from the main menu, and there is no login or tenant override.
//
// `outputDir` must mirror playwright.screenshots.config.ts (the spec builds
// absolute screenshot paths from process.cwd()).

export type UiReviewState = "filled" | "empty";
export type UiReviewViewport = "desktop" | "mobile";

export interface UiReviewClickStep {
  kind: "click";
  scope: "banner" | "complementary" | "main";
  role: "link" | "button";
  name?: string;
}

export interface UiReviewGotoStep {
  kind: "goto";
  path: string;
  reason: string;
}

export type UiReviewNavStep = UiReviewClickStep | UiReviewGotoStep;

export interface UiReviewRoute {
  name: string;
  path: string;
  states: UiReviewState[];
  viewports?: UiReviewViewport[];
  note?: string;
  seeds?: Partial<Record<UiReviewState, () => Promise<Record<string, unknown>>>>;
  nav?: Partial<Record<UiReviewState, UiReviewNavStep[]>>;
}

export interface UiReviewConfig {
  outputDir: string;
  routes: UiReviewRoute[];
}

export const uiReviewConfig: UiReviewConfig = {
  outputDir: "test-results/ui-screenshots",
  routes: [
    {
      name: "menu-en",
      path: "/en-GB",
      states: ["empty", "filled"],
      note: "Main menu (English). empty and filled are visually identical for a static menu.",
    },
    {
      name: "menu-de",
      path: "/de",
      states: ["filled"],
      note: "Main menu (German) — i18n verification.",
    },
    {
      name: "solo-letters",
      path: "/en-GB/solo/letters",
      states: ["empty", "filled"],
      nav: {
        filled: [
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
        ],
      },
      note: "empty = draw phase with no tiles; filled = nine tiles drawn.",
    },
    {
      name: "solo-numbers",
      path: "/en-GB/solo/numbers",
      states: ["empty", "filled"],
      nav: {
        filled: [
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
        ],
      },
      note: "empty = draw phase; filled = six tiles + target revealed.",
    },
    {
      name: "solo-conundrum",
      path: "/en-GB/solo/conundrum",
      states: ["empty", "filled"],
      nav: {
        filled: [{ kind: "click", scope: "main", role: "button", name: "Start" }],
      },
      note: "empty = timer toggle + Start; filled = scrambled tiles + timer running.",
    },
    {
      name: "lobby",
      path: "/en-GB",
      states: ["filled"],
      nav: {
        filled: [{ kind: "click", scope: "main", role: "link", name: "Multiplayer" }],
      },
      note: "A freshly created room with a single (host) player.",
    },
    {
      name: "round-letters",
      path: "/en-GB",
      states: ["filled"],
      nav: {
        filled: [
          { kind: "click", scope: "main", role: "link", name: "Multiplayer" },
          { kind: "click", scope: "main", role: "button", name: "Letters" },
          { kind: "click", scope: "main", role: "button", name: "Start Letters" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
          { kind: "click", scope: "main", role: "button", name: "Consonant" },
          { kind: "click", scope: "main", role: "button", name: "Vowel" },
        ],
      },
      note: "Multiplayer letters round as host, with tiles drawn.",
    },
    {
      name: "round-numbers",
      path: "/en-GB",
      states: ["filled"],
      nav: {
        filled: [
          { kind: "click", scope: "main", role: "link", name: "Multiplayer" },
          { kind: "click", scope: "main", role: "button", name: "Numbers" },
          { kind: "click", scope: "main", role: "button", name: "Start Numbers" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
          { kind: "click", scope: "main", role: "button", name: "Small" },
        ],
      },
      note: "Multiplayer numbers round as host, with tiles + target.",
    },
    {
      name: "round-conundrum",
      path: "/en-GB",
      states: ["filled"],
      nav: {
        filled: [
          { kind: "click", scope: "main", role: "link", name: "Multiplayer" },
          { kind: "click", scope: "main", role: "button", name: "Conundrum" },
          { kind: "click", scope: "main", role: "button", name: "Start Conundrum" },
        ],
      },
      note: "Multiplayer conundrum round as host — tiles auto-start on load.",
    },
  ],
};

export const routes = uiReviewConfig.routes;
