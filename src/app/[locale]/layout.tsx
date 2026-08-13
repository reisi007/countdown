import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Lexend_Deca } from "next/font/google";
import "@/styles/globals.css";

const lexendDeca = Lexend_Deca({
  subsets: ["latin", "latin-ext"],
  variable: "--font-lexend-deca",
});

export const metadata: Metadata = {
  title: "Countdown",
  description:
    "Countdown — a web-based clone of the classic TV game show",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a192f",
};

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={lexendDeca.variable} data-theme="countdown">
      <body className="min-h-screen bg-base-100 font-[family-name:var(--font-lexend-deca)] text-base-content">
        {children}
        <footer className="flex items-center justify-center gap-6 p-4 text-sm text-base-content/50">
          <Link href="/de/impressum" className="link link-hover">
            Impressum
          </Link>
          <a
            href="https://all-the.rest/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover"
          >
            Datenschutz
          </a>
        </footer>
      </body>
    </html>
  );
}
