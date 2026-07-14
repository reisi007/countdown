import type { Metadata } from "next";
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

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={lexendDeca.variable} data-theme="countdown">
      <body className="min-h-screen bg-base-100 font-[family-name:var(--font-lexend-deca)] text-base-content">
        {children}
      </body>
    </html>
  );
}
