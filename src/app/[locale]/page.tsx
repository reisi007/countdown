import Link from "next/link";

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
    </div>
  );
}
