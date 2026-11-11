import { useEffect, useId, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import {
  NAV_GROUP_LABELS,
  type NavGroup,
  type NavItem,
  navItemsByGroup,
  visibleNavItems,
} from "../nav-items";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2.5 font-display text-sm no-underline transition lg:inline-block lg:rounded-none lg:px-0.5 lg:py-1 ${
    isActive
      ? "nav-link-active text-lime"
      : "text-steel hover:bg-white/[0.03] hover:text-mist lg:hover:bg-transparent"
  }`;

function NavCountBadge({
  count,
  ariaLabel,
  testId,
}: {
  count: number;
  ariaLabel: string;
  testId: string;
}) {
  if (count <= 0) return null;
  const label = count > 9 ? "9+" : String(count);
  return (
    <span
      className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-rose px-1.5 py-0.5 font-display text-[11px] font-semibold leading-none text-white ring-1 ring-lime/45"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {label}
    </span>
  );
}

function CoinBalanceLink({
  balance,
  className = "",
}: {
  balance: number;
  className?: string;
}) {
  const label = formatCoins(balance);
  return (
    <Link
      to="/ledger"
      className={`nav-coin-chip inline-flex items-center rounded-md px-2.5 py-1 font-display text-sm font-semibold no-underline transition hover:border-lime/55 hover:bg-bay-panel/80 ${className}`}
      title="Open Brad Coin ledger"
      aria-label={`${label} — open ledger`}
    >
      {label}
    </Link>
  );
}

function NavItemLink({
  item,
  favouriteCount,
  pendingTradeInbox,
}: {
  item: NavItem;
  favouriteCount: number;
  pendingTradeInbox: number;
}) {
  return (
    <NavLink to={item.to} className={linkClass} end={item.to === "/cars" ? false : undefined}>
      {item.label}
      {item.badge === "favourites" ? (
        <NavCountBadge
          count={favouriteCount}
          ariaLabel={`${favouriteCount} favourite${favouriteCount === 1 ? "" : "s"}`}
          testId="favourites-nav-badge"
        />
      ) : null}
      {item.badge === "trades" ? (
        <NavCountBadge
          count={pendingTradeInbox}
          ariaLabel={`${pendingTradeInbox} pending trade offer${pendingTradeInbox === 1 ? "" : "s"}`}
          testId="trades-inbox-badge"
        />
      ) : null}
    </NavLink>
  );
}

function DesktopNavLinks({
  items,
  favouriteCount,
  pendingTradeInbox,
  coinBalance,
}: {
  items: NavItem[];
  favouriteCount: number;
  pendingTradeInbox: number;
  coinBalance: number | null;
}) {
  return (
    <>
      {items.map((item) => (
        <NavItemLink
          key={item.to}
          item={item}
          favouriteCount={favouriteCount}
          pendingTradeInbox={pendingTradeInbox}
        />
      ))}
      {coinBalance !== null ? (
        <CoinBalanceLink balance={coinBalance} className="mt-1 w-fit lg:mt-0 lg:ml-1" />
      ) : null}
    </>
  );
}

function MobileNavSections({
  items,
  favouriteCount,
  pendingTradeInbox,
  coinBalance,
}: {
  items: NavItem[];
  favouriteCount: number;
  pendingTradeInbox: number;
  coinBalance: number | null;
}) {
  const sections = navItemsByGroup(items);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
      {sections.map((section) => (
        <div key={section.group} className="flex flex-col gap-0.5">
          {section.group !== "auth" ? (
            <p className="px-3 pb-1 pt-1 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-steel/80">
              {NAV_GROUP_LABELS[section.group as Exclude<NavGroup, "auth">]}
            </p>
          ) : null}
          {section.items.map((item) => (
            <NavItemLink
              key={item.to}
              item={item}
              favouriteCount={favouriteCount}
              pendingTradeInbox={pendingTradeInbox}
            />
          ))}
        </div>
      ))}
      {coinBalance !== null ? (
        <CoinBalanceLink balance={coinBalance} className="mt-1 w-fit" />
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const {
    user,
    pendingTradeInbox,
    favouriteCount,
    refreshTradeInbox,
    refreshFavouriteCount,
  } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const items = visibleNavItems({ signedIn: Boolean(user), isAdmin });
  const coinBalance = user ? user.coinBalance : null;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) return;
    void refreshTradeInbox();
    void refreshFavouriteCount();
  }, [user, location.pathname, refreshTradeInbox, refreshFavouriteCount]);

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

  return (
    <header className="nav-shell relative z-20">
      <div className="nav-shell-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
        <Link to="/" className="group shrink-0 no-underline">
          <span className="font-display text-xl font-bold tracking-tight text-white transition group-hover:text-mist sm:text-2xl">
            BradApp
          </span>
          <span
            className="bay-brand-line mt-1.5 block h-0.5 w-12 rounded-full transition-[width] duration-300 group-hover:w-16 sm:w-14 sm:group-hover:w-[4.5rem]"
            aria-hidden
          />
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <CoinBalanceLink balance={user.coinBalance} className="lg:hidden" />
          ) : null}

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-bay-panel/40 text-mist transition hover:border-lime/40 hover:text-lime lg:hidden"
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
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose ring-2 ring-bay-deep ring-offset-0"
                data-testid="trades-inbox-menu-dot"
                aria-hidden
              />
            ) : null}
          </button>

          <nav className="hidden items-center gap-3 xl:gap-4 lg:flex" aria-label="Primary">
            <DesktopNavLinks
              items={items}
              favouriteCount={favouriteCount}
              pendingTradeInbox={pendingTradeInbox}
              coinBalance={coinBalance}
            />
          </nav>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-bay-deep/75 backdrop-blur-[2px] lg:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id={menuId}
            aria-label="Primary mobile"
            className="nav-shell-panel relative z-20 border-t lg:hidden"
          >
            <MobileNavSections
              items={items}
              favouriteCount={favouriteCount}
              pendingTradeInbox={pendingTradeInbox}
              coinBalance={coinBalance}
            />
          </nav>
        </>
      ) : null}
    </header>
  );
}
