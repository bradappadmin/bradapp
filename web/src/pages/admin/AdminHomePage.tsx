import { Link } from "react-router-dom";
import { AdminGuard } from "../../components/AdminGuard";
import { SiteHeader } from "../../components/SiteHeader";
import { useAuth } from "../../auth-context";
import { roleLabel } from "../../types";

export function AdminHomePage() {
  return (
    <AdminGuard>
      <AdminHomeInner />
    </AdminGuard>
  );
}

function AdminHomeInner() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Admin</h1>
          <p className="mt-2 text-sm text-steel">
            {user ? `${user.displayName} · ${roleLabel(user.role)}` : ""} — Brad and Napwood can correct
            accounts, stock, coins, and reviews. Members stay out.
          </p>
        </div>
        <ul className="mt-10 divide-y divide-white/10 border-t border-white/10">
          <li>
            <Link to="/admin/users" className="block py-5 text-mist no-underline hover:text-white">
              <span className="font-display text-lg font-semibold">Accounts</span>
              <span className="mt-1 block text-sm text-steel">
                List members, correct names, close accounts, adjust Brad Coins.
              </span>
            </Link>
          </li>
          <li>
            <Link to="/admin/inventory" className="block py-5 text-mist no-underline hover:text-white">
              <span className="font-display text-lg font-semibold">Cars & garages</span>
              <span className="mt-1 block text-sm text-steel">
                Edit models, listings, and garage details.
              </span>
            </Link>
          </li>
          <li>
            <Link to="/reviews" className="block py-5 text-mist no-underline hover:text-white">
              <span className="font-display text-lg font-semibold">Reviews</span>
              <span className="mt-1 block text-sm text-steel">
                Record or take down bay videos.
              </span>
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
