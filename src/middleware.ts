import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["en-GB", "en-US", "de"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const DEFAULT_LOCALE: Locale = "en-GB";

const LOCALE_ALIASES: Record<string, Locale> = {
  "en": "en-US",
  "en-AU": "en-GB",
  "en-CA": "en-US",
  "en-NZ": "en-GB",
  "en-IE": "en-GB",
  "de-DE": "de",
  "de-AT": "de",
  "de-CH": "de",
};

function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language") || "";

  const entries = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag, q = "q=1"] = entry.trim().split(";");
      const quality = parseFloat(q.replace("q=", ""));
      return { tag: tag.trim(), quality: isNaN(quality) ? 1 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of entries) {
    const primary = tag.split("-")[0];

    const alias = LOCALE_ALIASES[tag];
    if (alias && SUPPORTED_LOCALES.includes(alias)) return alias;

    const exact = SUPPORTED_LOCALES.find(
      (loc) => loc.toLowerCase() === tag.toLowerCase(),
    );
    if (exact) return exact;

    const langMatch = SUPPORTED_LOCALES.find(
      (loc) => loc.startsWith(primary),
    );
    if (langMatch) return langMatch;
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const locale of SUPPORTED_LOCALES) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return NextResponse.next();
    }
  }

  const originalLocale = pathname.split("/")[1] || "";
  const alias = LOCALE_ALIASES[originalLocale];
  if (alias) {
    const rest = pathname.substring(originalLocale.length + 1);
    const newUrl = new URL(`/${alias}${rest}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/signaling") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const locale = getPreferredLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: ["/((?!_next|api|signaling|favicon.ico).*)"],
};
