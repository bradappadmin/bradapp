import { useEffect, useId, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2.5 font-display text-sm no-underline transition md:inline md:rounded-none md:px-0 md:py-0 ${
    isActive ? "bg-white/5 text-lime md:bg-transparent" : "text-steel hover:text-mist"
  }`;

function InboxBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 9 ? "9+" : String(count);
  return (
    <span
      className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-rose px-1.5 py-0.5 font-display text-[11px] font-semibold leading-none text-white"
      aria-label={`${count} pending trade offer${count === 1 ? "" : "s"}`}
    >
      {label}
    </span>
  );
}

export function SiteHeader() {
  const { user, pendingTradeInbox, refreshTradeInbox } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) return;
    void refreshTradeInbox();
  }, [user, location.pathname, refreshTradeInbox]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const navLinks = (
    <>
      <NavLink to="/cars" className={linkClass} end={false}>
        Cars
      </NavLink>
      <NavLink to="/play" className={linkClass}>
        Play
      </NavLink>
      <NavLink to="/reviews" className={linkClass}>
        Reviews
      </NavLink>
      <NavLink to="/how-to" className={linkClass}>
        How to
      </NavLink>
      <NavLink to="/members" className={linkClass}>
        Members
      </NavLink>
      {user ? (
        <>
          <NavLink to="/leaderboard" className={linkClass}>
            Leaderboard
          </NavLink>
          <NavLink to="/garage" className={linkClass}>
            My cars
          </NavLink>
          <NavLink to="/favourites" className={linkClass}>
            Favourites
          </NavLink>
          <NavLink to="/trades" className={linkClass}>
            Trades
            <InboxBadge count={pendingTradeInbox} />
          </NavLink>
          <NavLink to="/account" className={linkClass}>
            Account
          </NavLink>
          {isAdmin ? (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          ) : null}
          <Link
            to="/garage"
            className="block rounded-md px-3 py-2.5 font-display text-sm font-semibold text-lime no-underline md:inline md:rounded-none md:px-0 md:py-0"
            title="Brad Coin balance"
          >
            {formatCoins(user.coinBalance)}
          </Link>
        </>
      ) : (
        <>
          <NavLink to="/signin" className={linkClass}>
            Sign in
          </NavLink>
          <NavLink to="/signup" className={linkClass}>
            Sign up
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <header className="relative z-20 border-b border-white/5 bg-bay-deep/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          to="/"
          className="shrink-0 font-display text-xl font-bold tracking-tight text-white no-underline"
        >
          BradApp
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/garage"
              className="font-display text-sm font-semibold text-lime no-underline md:hidden"
              title="Brad Coin balance"
            >
              {formatCoins(user.coinBalance)}
            </Link>
          ) : null}

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-mist transition hover:border-lime/40 hover:text-lime md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={
              menuOpen
                ? "Close menu"
                : pendingTradeInbox > 0
                  ? `Open menu, ${pendingTradeInbox} pending trade offer${pendingTradeInbox === 1 ? "" : "s"}`
                  : "Open menu"
            }
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden className="flex w-4 flex-col gap-1">
              <span
                className={`block h-0.5 w-full bg-current transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-full bg-current transition ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-full bg-current transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
              />
            </span>
            {pendingTradeInbox > 0 && !menuOpen ? (
              <span
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose"
                aria-hidden
              />
            ) : null}
          </button>

          <nav
            className="hidden items-center gap-5 md:flex"
            aria-label="Primary"
          >
            {navLinks}
          </nav>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-bay-deep/70 md:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id={menuId}
            aria-label="Primary mobile"
            className="relative z-20 border-t border-white/5 bg-bay-panel md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">{navLinks}</div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
