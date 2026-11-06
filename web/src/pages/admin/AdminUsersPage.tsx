import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../api";
import type { AdminUser } from "../../api";
import { useAuth } from "../../auth-context";
import { AdminGuard } from "../../components/AdminGuard";
import { SiteHeader } from "../../components/SiteHeader";
import { formatCoins } from "../../cars";

export function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersInner />
    </AdminGuard>
  );
}

function AdminUsersInner() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [coinDelta, setCoinDelta] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    const res = await api.fetchAdminUsers();
    setUsers(res.users);
  }

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load users");
    });
  }, []);

  async function saveName(id: number, displayName: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.patchAdminUser(id, { displayName });
      setMessage("Account updated.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function setStatus(id: number, accountStatus: "active" | "closed") {
    setBusyId(id);
    setError(null);
    try {
      await api.patchAdminUser(id, { accountStatus });
      setMessage(accountStatus === "closed" ? "Account closed." : "Account reopened.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status change failed");
    } finally {
      setBusyId(null);
    }
  }

  async function adjustCoins(id: number) {
    const delta = Number(coinDelta[id]);
    if (!Number.isFinite(delta) || delta === 0) {
      setError("Enter a non-zero coin delta");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await api.adjustAdminCoins(id, { delta: Math.trunc(delta), note: "Admin correction" });
      setMessage("Balance corrected via ledger.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coin adjust failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/admin" className="text-sm text-lime no-underline hover:underline">
          ← Admin
        </Link>
        <h1 className="bay-rise mt-4 font-display text-3xl font-semibold text-white">Accounts</h1>
        <p className="mt-2 text-sm text-steel">
          Correct friend and family accounts. Coin changes write an <code>admin_adjust</code> ledger
          row.
        </p>
        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

        <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {users.map((row) => (
            <li key={row.id} className="grid gap-3 py-5 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="font-display text-lg text-mist">{row.displayName}</p>
                <p className="text-sm text-steel">
                  {row.email} · {row.role} · {row.accountStatus} · {formatCoins(row.coinBalance)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    className="rounded-md border border-white/10 bg-bay-panel px-2 py-1.5 text-sm text-mist"
                    defaultValue={row.displayName}
                    id={`name-${row.id}`}
                  />
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => {
                      const el = document.getElementById(`name-${row.id}`) as HTMLInputElement | null;
                      void saveName(row.id, el?.value.trim() || row.displayName);
                    }}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist"
                  >
                    Save name
                  </button>
                  {row.accountStatus === "active" ? (
                    <button
                      type="button"
                      disabled={busyId === row.id || row.id === user?.id}
                      onClick={() => void setStatus(row.id, "closed")}
                      className="rounded-md border border-rose/40 px-3 py-1.5 text-sm text-rose"
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void setStatus(row.id, "active")}
                      className="rounded-md border border-lime/40 px-3 py-1.5 text-sm text-lime"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                  Coin delta
                  <input
                    className="w-28 rounded-md border border-white/10 bg-bay-panel px-2 py-1.5 text-sm text-mist"
                    type="number"
                    value={coinDelta[row.id] ?? ""}
                    onChange={(e) => setCoinDelta((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  />
                </label>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void adjustCoins(row.id)}
                  className="rounded-md bg-rose px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Adjust coins
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
