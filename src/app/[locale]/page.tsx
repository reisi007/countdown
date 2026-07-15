import Link from "next/link";

const LOCALES = [
  { code: "en-GB", label: "English (UK)" },
  { code: "en-US", label: "English (US)" },
  { code: "de", label: "Deutsch" },
] as const;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MainMenu({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">Countdown</h1>
        <p className="mt-2 text-xl text-base-content/60">
          The Classic TV Game Show
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        <Link
          href={`/${locale}/solo`}
          className="btn btn-primary btn-lg w-full"
        >
          Solo Play
        </Link>
        <Link
          href={`/${locale}/room/new`}
          className="btn btn-secondary btn-lg w-full"
        >
          Multiplayer
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {LOCALES.map((loc) => (
          <Link
            key={loc.code}
            href={`/${loc.code}`}
            className={`btn btn-xs ${locale === loc.code ? "btn-primary" : "btn-ghost"}`}
          >
            {loc.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
