import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-display text-sm no-underline transition ${
    isActive ? "text-lime" : "text-steel hover:text-mist"
  }`;

export function SiteHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <header className="relative z-10 border-b border-white/5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-white no-underline">
          BradApp
        </Link>
        <nav className="flex flex-wrap items-center gap-4 sm:gap-5">
          <NavLink to="/cars" className={linkClass} end={false}>
            Cars
          </NavLink>
          <NavLink to="/play" className={linkClass}>
            Play
          </NavLink>
          <NavLink to="/reviews" className={linkClass}>
            Reviews
          </NavLink>
          {user ? (
            <>
              <NavLink to="/garage" className={linkClass}>
                My cars
              </NavLink>
              <NavLink to="/trades" className={linkClass}>
                Trades
              </NavLink>
              {isAdmin ? (
                <NavLink to="/admin" className={linkClass}>
                  Admin
                </NavLink>
              ) : null}
              <Link
                to="/garage"
                className="font-display text-sm font-semibold text-lime no-underline"
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
        </nav>
      </div>
    </header>
  );
}
