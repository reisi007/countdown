"use client";

import { useRouter, usePathname } from "next/navigation";

const LOCALES = [
  { code: "en-GB", label: "English (UK)" },
  { code: "en-US", label: "English (US)" },
  { code: "de", label: "Deutsch" },
];

export function LocaleSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const currentLocale = pathname.split("/")[1] || "en-GB";
  const currentLabel = LOCALES.find((l) => l.code === currentLocale)?.label ?? currentLocale;

  const switchLocale = (code: string) => {
    const newPath = pathname.replace(/^\/[^/]+/, `/${code}`);
    router.push(newPath);
  };

  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-ghost btn-sm" role="button" aria-label="Select language">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="hidden sm:inline">{currentLabel}</span>
      </summary>
      <ul className="dropdown-content menu rounded-box z-10 w-52 bg-base-100 p-2 shadow-lg">
        {LOCALES.map((locale) => (
          <li key={locale.code}>
            <button
              className={locale.code === currentLocale ? "active" : ""}
              onClick={() => switchLocale(locale.code)}
            >
              {locale.label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
