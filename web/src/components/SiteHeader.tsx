import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-display text-sm no-underline transition ${
    isActive ? "text-lime" : "text-steel hover:text-mist"
  }`;

export function SiteHeader() {
  const { user } = useAuth();

  return (
    <header className="relative z-10 border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-white no-underline">
          BradApp
        </Link>
        <nav className="flex flex-wrap items-center gap-4 sm:gap-6">
          <NavLink to="/cars" className={linkClass}>
            Cars
          </NavLink>
          {user ? (
            <>
              <NavLink to="/garage" className={linkClass}>
                My garage
              </NavLink>
              <span className="font-display text-sm text-lime">{formatCoins(user.coinBalance)}</span>
              <NavLink to="/" className={linkClass}>
                Home
              </NavLink>
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
