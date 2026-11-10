import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../../api";
import type { AdminUser } from "../../api";
import {
  ADMIN_ACCOUNTS_GROUP_OPTIONS,
  filterAdminAccounts,
  parseAdminAccountsGroup,
  type AdminAccountsGroup,
} from "../../admin-accounts-filter";
import { useAuth } from "../../auth-context";
import { AdminCoinDeltaChips } from "../../components/AdminCoinDeltaChips";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";
import { formatCoins } from "../../cars";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

export function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersInner />
    </AdminGuard>
  );
}

function AdminUsersInner() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const group = parseAdminAccountsGroup(searchParams.get("group"));
  const [draft, setDraft] = useState(qFromUrl);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [coinDelta, setCoinDelta] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const visible = useMemo(
    () => filterAdminAccounts(users, qFromUrl, group),
    [users, qFromUrl, group],
  );

  function writeParams(nextQ: string, nextGroup: AdminAccountsGroup) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextGroup !== "all") params.set("group", nextGroup);
    setSearchParams(params, { replace: true });
  }

  async function reload() {
    const res = await api.fetchAdminUsers();
    setUsers(res.users);
  }

  useEffect(() => {
    setDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter-as-you-type: debounce URL updates (client filter over the loaded list).
  useEffect(() => {
    const next = draft.trim();
    if (next === qFromUrl) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      if (group !== "all") params.set("group", group);
      setSearchParams(params, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, group, setSearchParams]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeParams(draft, group);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("", "all");
  }

  function setGroup(next: AdminAccountsGroup) {
    writeParams(qFromUrl, next);
  }

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
      const nextMessage =
        accountStatus === "frozen"
          ? "Account frozen — they cannot sign in until unfrozen."
          : accountStatus === "closed"
            ? "Account closed."
            : "Account unfrozen / reopened.";
      setMessage(nextMessage);
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

  const filtersOn = Boolean(qFromUrl) || group !== "all";

  return (
    <AdminShell
      wide
      title="Accounts"
      description={
        <>
          Correct friend and family accounts. Freeze blocks sign-in until unfrozen — Napwood can
          freeze Brad; Brad cannot freeze Napwood. Coin changes write an <code>admin_adjust</code>{" "}
          ledger row. See the full trail on{" "}
          <Link to="/admin/coin-history" className="text-lime no-underline hover:underline">
            Coin adjustments
          </Link>
          .
        </>
      }
    >
      {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

      <form
        onSubmit={onSubmit}
        className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
        role="search"
        aria-label="Search accounts"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="font-display text-lg text-mist sm:text-xl">Find an account</h2>
          <p className="text-xs text-steel">Name or email · filter as you type · stays in the URL</p>
        </div>
        <label className="mt-4 flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
          Search
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={fieldClass}
              type="search"
              name="q"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Display name or email…"
              aria-label="Search accounts by display name or email"
              autoComplete="off"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="submit"
                className="rounded-md bg-rose px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:brightness-110"
              >
                Search
              </button>
              {filtersOn ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </label>

        <div className="mt-5 border-t border-white/8 pt-4">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Filter by type</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter accounts by type"
          >
            {ADMIN_ACCOUNTS_GROUP_OPTIONS.map((option) => {
              const active = group === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setGroup(option.id)}
                  className={`rounded-md border px-3 py-1.5 font-display text-sm transition ${
                    active
                      ? "border-lime/50 bg-lime/10 text-lime"
                      : "border-white/15 text-steel hover:border-lime/35 hover:text-lime"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {filtersOn ? (
          <p className="mt-4 text-sm text-steel">
            Showing{" "}
            {!loading ? (
              <>
                {visible.length} of {users.length}{" "}
                {users.length === 1 ? "account" : "accounts"}
              </>
            ) : (
              "…"
            )}
            {qFromUrl ? (
              <>
                {" "}
                for <span className="font-display text-lime">“{qFromUrl}”</span>
              </>
            ) : null}
            {group !== "all" ? (
              <>
                {" "}
                ·{" "}
                <span className="font-display text-lime">
                  {ADMIN_ACCOUNTS_GROUP_OPTIONS.find((o) => o.id === group)?.label}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </form>

      <div className="mt-8 mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-mist">Directory</h2>
        <p className="text-sm text-steel">
          {loading
            ? "Loading…"
            : `${visible.length} ${visible.length === 1 ? "account" : "accounts"}`}
        </p>
      </div>

      {!loading && visible.length === 0 ? (
        <div
          className="play-panel bay-rise-delay rounded-md border px-5 py-12 text-center sm:py-14"
          role="status"
          aria-label={filtersOn ? "No matching accounts" : "Empty accounts directory"}
        >
          {filtersOn ? (
            <>
              <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                No accounts match
                {qFromUrl ? ` “${qFromUrl}”` : " that filter"}. Try another spelling or clear the
                filters — role chips stay ready above.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Clear filters
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-xl text-mist sm:text-2xl">No accounts yet</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                The admin directory is empty right now.
              </p>
            </>
          )}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
          {visible.map((row) => (
            <li key={row.id} className="admin-row grid gap-4 py-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <p className="font-display text-lg text-mist break-words">{row.displayName}</p>
                <p className="text-sm text-steel break-all">{row.email}</p>
                <p className="mt-1 text-sm text-steel">
                  {row.role} · {row.accountStatus} · {formatCoins(row.coinBalance)}
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <input
                    className="w-full min-w-0 flex-1 rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:min-w-[12rem]"
                    defaultValue={row.displayName}
                    id={`name-${row.id}`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => {
                        const el = document.getElementById(
                          `name-${row.id}`,
                        ) as HTMLInputElement | null;
                        void saveName(row.id, el?.value.trim() || row.displayName);
                      }}
                      className="rounded-md border border-white/15 px-3 py-2 text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                    >
                      Save name
                    </button>
                    {row.accountStatus === "active" ? (
                      <button
                        type="button"
                        disabled={busyId === row.id || row.id === user?.id}
                        onClick={() => void setStatus(row.id, "frozen")}
                        className="rounded-md border border-rose/40 px-3 py-2 text-sm text-rose transition hover:bg-rose/10"
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
                        className="rounded-md border border-lime/40 px-3 py-2 text-sm text-lime transition hover:bg-lime/10"
                      >
                        {row.accountStatus === "frozen" ? "Unfreeze" : "Reopen"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="admin-panel flex flex-col gap-3 rounded-md border p-3">
                <AdminCoinDeltaChips
                  memberLabel={row.displayName}
                  value={coinDelta[row.id] ?? ""}
                  disabled={busyId === row.id}
                  onSelect={(amount) =>
                    setCoinDelta((prev) => ({ ...prev, [row.id]: String(amount) }))
                  }
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex w-full flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:w-auto">
                    Coin delta
                    <input
                      className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2 sm:w-28"
                      type="number"
                      inputMode="numeric"
                      aria-label={`Coin delta for ${row.displayName}`}
                      value={coinDelta[row.id] ?? ""}
                      onChange={(e) =>
                        setCoinDelta((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void adjustCoins(row.id)}
                    className="w-full rounded-md bg-rose px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 sm:w-auto"
                  >
                    Adjust coins
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminShell>
  );
}
