import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function SoloMenu({ params }: Props) {
  const { locale } = await params;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary">Solo Play</h1>
      <div className="flex w-full max-w-md flex-col gap-4">
        <Link href={`/${locale}/solo/letters`} className="btn btn-primary btn-lg w-full">Letters Round</Link>
        <Link href={`/${locale}/solo/numbers`} className="btn btn-secondary btn-lg w-full">Numbers Round</Link>
        <Link href={`/${locale}/solo/conundrum`} className="btn btn-accent btn-lg w-full">Conundrum</Link>
      </div>
      <Link href={`/${locale}`} className="btn btn-ghost mt-4">Back</Link>
    </div>
  );
}
