import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.22),transparent_70%)]" />
      <header className="bay-rise relative mb-10">
        <Link to="/" className="inline-block no-underline">
          <p className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            BradApp
          </p>
          <span className="bay-brand-line mt-3 block h-1 w-24 rounded-full" />
        </Link>
        <h1 className="mt-8 font-display text-2xl font-semibold text-mist">{title}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-steel">{subtitle}</p>
      </header>
      <div className="bay-rise-delay relative">{children}</div>
    </div>
  );
}
