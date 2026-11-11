import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PlayBayAtmosphere } from "./PlayBayAtmosphere";

export function AuthShell({
  title,
  subtitle,
  notes,
  children,
}: {
  title: string;
  subtitle: string;
  /** Optional bay chips under the subtitle (e.g. invite-only). */
  notes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <PlayBayAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <header className="bay-rise">
          <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
          <Link to="/" className="mt-4 inline-block no-underline">
            <p className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
              BradApp
            </p>
            <span className="bay-brand-line mt-3 block h-1 w-28 rounded-full sm:w-36" />
          </Link>
          <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight text-mist sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-steel sm:text-base">{subtitle}</p>
          {notes ? (
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Auth bay notes">
              {notes}
            </div>
          ) : null}
        </header>
        <div className="bay-rise-delay relative mt-8">{children}</div>
      </div>
    </div>
  );
}
