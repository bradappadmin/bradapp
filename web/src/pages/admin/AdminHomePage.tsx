import { Link } from "react-router-dom";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";
import { useAuth } from "../../auth-context";
import { roleLabel } from "../../types";

const SECTIONS = [
  {
    to: "/admin/users",
    title: "Accounts",
    body: "List members, correct names, freeze or close accounts, adjust Brad Coins.",
  },
  {
    to: "/admin/invites",
    title: "Family invites",
    body: "Create, copy, and revoke optional signup invite codes.",
  },
  {
    to: "/admin/coin-history",
    title: "Coin adjustments",
    body: "Who changed which balance, by how much, when, and the note.",
  },
  {
    to: "/admin/inventory",
    title: "Cars & garages",
    body: "Edit models, listings, and garage details.",
  },
  {
    to: "/reviews",
    title: "Reviews",
    body: "Record or take down bay videos.",
  },
] as const;

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
    <AdminShell
      title="Admin"
      description={
        <>
          {user ? `${user.displayName} · ${roleLabel(user.role)}` : ""} — Brad and Napwood can
          correct accounts, stock, coins, and reviews. Members stay out.
        </>
      }
    >
      <ul className="mt-10 divide-y divide-white/10 border-t border-white/10">
        {SECTIONS.map((section) => (
          <li key={section.to} className="admin-row">
            <Link
              to={section.to}
              className="block py-5 text-mist no-underline transition hover:text-white"
            >
              <span className="font-display text-lg font-semibold">{section.title}</span>
              <span className="mt-1 block text-sm text-steel">{section.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
