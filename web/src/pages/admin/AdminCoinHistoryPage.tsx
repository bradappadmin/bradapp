import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../../api";
import type { AdminCoinAdjustment, AdminUser } from "../../api";
import {
  ADMIN_COINS_BALANCE_OPTIONS,
  ADMIN_COINS_LOW_BALANCE,
  filterAdminCoinsMembers,
  parseAdminCoinsBalanceGroup,
  type AdminCoinsBalanceGroup,
} from "../../admin-coins-member-filter";
import { AdminCoinDeltaChips } from "../../components/AdminCoinDeltaChips";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";
import { formatCoins } from "../../cars";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDelta(delta: number): string {
  const abs = formatCoins(Math.abs(delta));
  return delta > 0 ? `+${abs}` : `−${abs}`;
}

export function AdminCoinHistoryPage() {
  return (
    <AdminGuard>
      <AdminCoinHistoryInner />
    </AdminGuard>
  );
}

function AdminCoinHistoryInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const group = parseAdminCoinsBalanceGroup(searchParams.get("group"));
  const [draft, setDraft] = useState(qFromUrl);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adjustments, setAdjustments] = useState<AdminCoinAdjustment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [coinDelta, setCoinDelta] = useState<Record<number, string>>({});
  const [coinNote, setCoinNote] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const visible = useMemo(
    () => filterAdminCoinsMembers(users, qFromUrl, group),
    [users, qFromUrl, group],
  );
  const filtersOn = Boolean(qFromUrl) || group !== "all";

  function writeParams(nextQ: string, nextGroup: AdminCoinsBalanceGroup) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextGroup !== "all") params.set("group", nextGroup);
    setSearchParams(params, { replace: true });
  }

  async function reload() {
    const [userList, history] = await Promise.all([
      api.fetchAdminUsers(),
      api.fetchAdminCoinAdjustments(80),
    ]);
    setUsers(userList.users);
    setAdjustments(history.adjustments);
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
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load coin tools");
        }
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

  function setGroup(next: AdminCoinsBalanceGroup) {
    writeParams(qFromUrl, next);
  }

  async function adjustCoins(id: number) {
    const delta = Number(coinDelta[id]);
    if (!Number.isFinite(delta) || delta === 0) {
      setError("Enter a non-zero coin delta");
      return;
    }
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const note = (coinNote[id] ?? "").trim() || "Admin correction";
      await api.adjustAdminCoins(id, { delta: Math.trunc(delta), note });
      setMessage("Balance corrected via ledger.");
      setCoinDelta((prev) => ({ ...prev, [id]: "" }));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coin adjust failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell
      wide
      title="Coin adjustments"
      description={
        <>
          Find a member, correct their Brad Coin balance, then review who changed what. Admin
          corrections only — buys, play rewards, and daily bonuses stay on each member’s{" "}
          <Link to="/ledger" className="text-lime no-underline hover:underline">
            ledger
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
        aria-label="Search members for coin adjust"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="font-display text-lg text-mist sm:text-xl">Find a member</h2>
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
              aria-label="Search members by display name or email"
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
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Filter by balance</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter members by balance"
          >
            {ADMIN_COINS_BALANCE_OPTIONS.map((option) => {
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
          <p className="mt-2 text-xs text-steel">
            Low balance is under {ADMIN_COINS_LOW_BALANCE} BC (starter pack size).
          </p>
        </div>

        {filtersOn ? (
          <p className="mt-4 text-sm text-steel">
            Showing{" "}
            {!loading ? (
              <>
                {visible.length} of {users.length}{" "}
                {users.length === 1 ? "member" : "members"}
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
                  {ADMIN_COINS_BALANCE_OPTIONS.find((o) => o.id === group)?.label}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </form>

      <div className="mt-8 mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-mist">Adjust balance</h2>
        <p className="text-sm text-steel">
          {loading
            ? "Loading…"
            : `${visible.length} ${visible.length === 1 ? "member" : "members"}`}
        </p>
      </div>

      {!loading && visible.length === 0 ? (
        <div
          className="play-panel bay-rise-delay rounded-md border px-5 py-12 text-center sm:py-14"
          role="status"
          aria-label={filtersOn ? "No matching members" : "Empty members directory"}
        >
          {filtersOn ? (
            <>
              <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                No members match
                {qFromUrl ? ` “${qFromUrl}”` : " that balance filter"}. Try another spelling or clear
                the filters — adjust forms return with the list.
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
              <p className="font-display text-xl text-mist sm:text-2xl">No members yet</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                The bay directory is empty right now.
              </p>
            </>
          )}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
          {visible.map((row) => (
            <li key={row.id} className="admin-row grid gap-4 py-5 lg:grid-cols-[1.2fr_1fr]">
              <div className="min-w-0">
                <p className="font-display text-lg text-mist break-words">{row.displayName}</p>
                <p className="text-sm text-steel break-all">{row.email}</p>
                <p className="mt-1 text-sm text-steel">
                  {row.role} · {row.accountStatus} ·{" "}
                  <span className="font-display text-lime">{formatCoins(row.coinBalance)}</span>
                </p>
                <div className="mt-3">
                  <Link
                    to={`/members/${row.id}`}
                    className="inline-flex rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-2 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                    aria-label={`Open member ${row.displayName}`}
                  >
                    Open member
                  </Link>
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
                  <label className="flex w-full flex-col gap-1 text-xs uppercase tracking-wide text-steel sm:w-28">
                    Coin delta
                    <input
                      className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
                      type="number"
                      inputMode="numeric"
                      aria-label={`Coin delta for ${row.displayName}`}
                      value={coinDelta[row.id] ?? ""}
                      onChange={(e) =>
                        setCoinDelta((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                    />
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs uppercase tracking-wide text-steel">
                    Note
                    <input
                      className="w-full rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
                      type="text"
                      aria-label={`Adjustment note for ${row.displayName}`}
                      placeholder="Admin correction"
                      value={coinNote[row.id] ?? ""}
                      onChange={(e) =>
                        setCoinNote((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void adjustCoins(row.id)}
                    className="w-full rounded-md bg-rose px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
                  >
                    {busyId === row.id ? "Saving…" : "Adjust coins"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-12 mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-mist">Recent adjustments</h2>
        <p className="text-sm text-steel">
          {loading
            ? "Loading…"
            : `${adjustments.length} ${adjustments.length === 1 ? "row" : "rows"}`}
        </p>
      </div>

      {!loading && adjustments.length === 0 ? (
        <p className="mt-4 text-sm text-steel">
          No admin adjustments yet. Correct a balance above — or from{" "}
          <Link to="/admin/users" className="text-lime no-underline hover:underline">
            Accounts
          </Link>
          .
        </p>
      ) : null}

      <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
        {adjustments.map((row) => (
          <li key={row.id} className="admin-row grid gap-2 py-5 sm:grid-cols-[1.2fr_1fr]">
            <div className="min-w-0">
              <p className="font-display text-lg text-mist break-words">
                {row.userDisplayName}
                <span className="ml-2 text-sm font-normal text-steel">{row.userEmail}</span>
              </p>
              <p className="mt-1 text-sm text-steel">
                By {row.createdByDisplayName ?? "Unknown admin"} · {formatWhen(row.createdAt)}
              </p>
              {row.note ? <p className="mt-2 text-sm text-mist">{row.note}</p> : null}
              <div className="mt-3">
                <Link
                  to={`/members/${row.userId}`}
                  className="inline-flex rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-2 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                  aria-label={`Open member ${row.userDisplayName}`}
                >
                  Open member
                </Link>
              </div>
            </div>
            <div className="sm:text-right">
              <p
                className={`font-display text-xl font-semibold ${
                  row.delta >= 0 ? "text-lime" : "text-rose"
                }`}
              >
                {formatDelta(row.delta)}
              </p>
              <p className="mt-1 text-sm text-steel">
                Balance after {formatCoins(row.balanceAfter)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
