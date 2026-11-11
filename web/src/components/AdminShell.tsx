import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/users", label: "Accounts", end: false },
  { to: "/admin/invites", label: "Invites", end: false },
  { to: "/admin/coin-history", label: "Coins", end: false },
  { to: "/admin/inventory", label: "Cars", end: false },
] as const;

type AdminShellProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Wider content column for tables / account rows. */
  wide?: boolean;
  actions?: ReactNode;
};

function subnavClass({ isActive }: { isActive: boolean }): string {
  return `shrink-0 whitespace-nowrap px-3 py-2.5 font-display text-sm no-underline transition ${
    isActive ? "admin-subnav-link-active" : "text-steel hover:text-mist"
  }`;
}

/** Shared Midnight Garage chrome for the admin bay. */
export function AdminShell({
  title,
  description,
  children,
  wide = false,
  actions,
}: AdminShellProps) {
  const maxWidth = wide ? "max-w-5xl" : "max-w-4xl";

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <div className="admin-bay-glow pointer-events-none absolute inset-x-0 top-0 h-64" aria-hidden />

      <div className="admin-subnav relative border-b">
        <nav
          className={`mx-auto flex ${maxWidth} gap-1 overflow-x-auto px-2 sm:px-4 sm:gap-2`}
          aria-label="Admin"
        >
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={subnavClass}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/reviews" className={subnavClass}>
            Reviews
          </NavLink>
        </nav>
      </div>

      <main className={`relative mx-auto ${maxWidth} px-4 py-8 sm:px-6 sm:py-10`}>
        <div className="bay-rise flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Admin bay</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-white">{title}</h1>
            {description ? (
              <div className="mt-2 max-w-2xl text-sm leading-relaxed text-steel">{description}</div>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
