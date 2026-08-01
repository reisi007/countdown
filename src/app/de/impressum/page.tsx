import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-box bg-base-200/60 p-6 sm:p-8 shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Impressum</h1>

        <div className="divider" />

        <h2 className="card-title text-sm">
          Angaben gem&auml;&szlig; &sect; 5 ECG (E-Commerce-Gesetz)
        </h2>
        <div className="mt-3 space-y-1 text-base-content/80">
          <p>Florian Reisinger</p>
          <p>Robert-Stolz-Stra&szlig;e 8</p>
          <p>4020 Linz</p>
          <p>&Ouml;sterreich</p>
          <p className="mt-2">
            E-Mail:{" "}
            <a href="mailto:hello@all-the.rest" className="link link-primary">
              hello@all-the.rest
            </a>
          </p>
        </div>

        <div className="divider" />

        <h2 className="card-title text-sm">
          Offenlegung gem&auml;&szlig; &sect; 25 MedienG (Mediengesetz)
        </h2>
        <div className="mt-3 space-y-1 text-base-content/80">
          <p>
            <span className="font-semibold">Medieninhaber:</span> Florian Reisinger
          </p>
          <p>
            <span className="font-semibold">Anschrift:</span> Robert-Stolz-Stra&szlig;e 8,
            4020 Linz, &Ouml;sterreich
          </p>
          <p>
            <span className="font-semibold">Grundlegende Richtung:</span> Private,
            nicht-kommerzielle Webanwendung (Countdown-Spiel); keine redaktionelle
            Berichterstattung
          </p>
        </div>

        <div className="divider" />

        <p className="text-sm text-base-content/60">
          Datenschutzerkl&auml;rung:{" "}
          <a
            href="https://all-the.rest/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            https://all-the.rest/datenschutz
          </a>
        </p>
      </div>

      <Link href="/de" className="btn btn-ghost btn-sm">
        Zur&uuml;ck
      </Link>
    </div>
  );
}
