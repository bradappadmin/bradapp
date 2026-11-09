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

  async function setStatus(id: number, accountStatus: AdminUser["accountStatus"]) {
    setBusyId(id);
    setError(null);
    try {
      await api.patchAdminUser(id, { accountStatus });
      const message =
        accountStatus === "frozen"
          ? "Account frozen — they cannot sign in until unfrozen."
          : accountStatus === "closed"
            ? "Account closed."
            : "Account unfrozen / reopened.";
      setMessage(message);
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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/admin" className="text-sm text-lime no-underline hover:underline">
          ← Admin
        </Link>
        <h1 className="bay-rise mt-4 font-display text-3xl font-semibold text-white">Accounts</h1>
        <p className="mt-2 text-sm text-steel">
          Correct friend and family accounts. Freeze blocks sign-in until unfrozen — Napwood can
          freeze Brad; Brad cannot freeze Napwood. Coin changes write an <code>admin_adjust</code>{" "}
          ledger row. See the full trail on{" "}
          <Link to="/admin/coin-history" className="text-lime no-underline hover:underline">
            Coin adjustments
          </Link>
          .
        </p>
        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

        <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {users.map((row) => (
            <li key={row.id} className="grid gap-4 py-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <p className="font-display text-lg text-mist break-words">{row.displayName}</p>
                <p className="text-sm text-steel break-all">
                  {row.email}
                </p>
                <p className="mt-1 text-sm text-steel">
                  {row.role} · {row.accountStatus} · {formatCoins(row.coinBalance)}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <input
                    className="w-full min-w-0 flex-1 rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist sm:min-w-[12rem]"
                    defaultValue={row.displayName}
                    id={`name-${row.id}`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => {
                        const el = document.getElementById(`name-${row.id}`) as HTMLInputElement | null;
                        void saveName(row.id, el?.value.trim() || row.displayName);
                      }}
                      className="rounded-md border border-white/15 px-3 py-2 text-sm text-mist"
                    >
                      Save name
                    </button>
                    {row.accountStatus === "active" ? (
                      <button
                        type="button"
                        disabled={busyId === row.id || row.id === user?.id}
                        onClick={() => void setStatus(row.id, "frozen")}
                        className="rounded-md border border-rose/40 px-3 py-2 text-sm text-rose"
                        title={
                          user?.role === "admin" && row.role !== "member"
                            ? "Brad can only freeze members"
                            : "Freeze — blocks sign-in until unfrozen"
                        }
                      >
                        Freeze
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void setStatus(row.id, "active")}
                        className="rounded-md border border-lime/40 px-3 py-2 text-sm text-lime"
                      >
                        {row.accountStatus === "frozen" ? "Unfreeze" : "Reopen"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex w-full flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:w-auto">
                  Coin delta
                  <input
                    className="w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist sm:w-28"
                    type="number"
                    value={coinDelta[row.id] ?? ""}
                    onChange={(e) => setCoinDelta((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  />
                </label>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => void adjustCoins(row.id)}
                  className="w-full rounded-md bg-rose px-3 py-2 text-sm font-semibold text-white sm:w-auto"
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
