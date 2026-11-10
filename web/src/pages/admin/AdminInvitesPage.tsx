import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import * as api from "../../api";
import type { FamilyInvite } from "../../api";
import {
  ADMIN_INVITES_GROUP_OPTIONS,
  filterAdminInvites,
  inviteLifecycle,
  inviteStatusLabel,
  parseAdminInvitesGroup,
  type AdminInvitesGroup,
} from "../../admin-invites-filter";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";
import { copyTextToClipboard } from "../../share-link";
import { useToast } from "../../toast-context";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

export function AdminInvitesPage() {
  return (
    <AdminGuard>
      <AdminInvitesInner />
    </AdminGuard>
  );
}

function AdminInvitesInner() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const group = parseAdminInvitesGroup(searchParams.get("group"));
  const [draft, setDraft] = useState(qFromUrl);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [requireInviteCode, setRequireInviteCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const visible = useMemo(
    () => filterAdminInvites(invites, qFromUrl, group),
    [invites, qFromUrl, group],
  );
  const filtersOn = Boolean(qFromUrl) || group !== "all";

  function writeParams(nextQ: string, nextGroup: AdminInvitesGroup) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextGroup !== "all") params.set("group", nextGroup);
    setSearchParams(params, { replace: true });
  }

  async function reload() {
    const res = await api.fetchAdminInvites();
    setInvites(res.invites);
    setRequireInviteCode(Boolean(res.requireInviteCode));
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
          setError(err instanceof Error ? err.message : "Could not load invites");
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

  function onSubmitSearch(event: FormEvent) {
    event.preventDefault();
    writeParams(draft, group);
  }

  function onClearSearch() {
    setDraft("");
    writeParams("", group);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("", "all");
  }

  function setGroup(next: AdminInvitesGroup) {
    writeParams(qFromUrl, next);
  }

  async function onToggleRequire(next: boolean) {
    setToggleBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.setAdminRequireInvite(next);
      setRequireInviteCode(res.requireInviteCode);
      setMessage(
        res.requireInviteCode
          ? "Signup now requires a valid invite code."
          : "Signup is open again — invite codes stay optional.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update setting");
    } finally {
      setToggleBusy(false);
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const parsedMax = maxUses.trim() === "" ? null : Number(maxUses);
      if (parsedMax != null && (!Number.isFinite(parsedMax) || parsedMax < 1)) {
        setError("Max uses must be a positive number, or leave blank for unlimited.");
        return;
      }
      const res = await api.createAdminInvite({
        code: code.trim() || undefined,
        maxUses: parsedMax,
        expiresAt: expiresAt.trim() ? new Date(expiresAt).toISOString() : null,
      });
      setMessage(`Created invite ${res.invite.code}.`);
      setCode("");
      setMaxUses("");
      setExpiresAt("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: number) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.revokeAdminInvite(id);
      setMessage("Invite revoked.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke invite");
    } finally {
      setBusy(false);
    }
  }

  async function onCopy(invite: FamilyInvite) {
    const ok = await copyTextToClipboard(invite.code);
    if (ok) {
      setCopiedId(invite.id);
      setError(null);
      const note = `Copied ${invite.code}.`;
      setMessage(note);
      toast.success(note);
      window.setTimeout(() => setCopiedId((current) => (current === invite.id ? null : current)), 2000);
      return;
    }
    const msg = "Could not copy — select the code manually.";
    setError(msg);
    toast.error(msg);
  }

  return (
    <AdminShell
      title="Family invites"
      description={
        requireInviteCode
          ? "Invite codes are required to sign up. Create, copy, and revoke codes here."
          : "Create optional invite codes for friends and family. Sign-up still works without a code unless you require invites below."
      }
    >
      <section
        className="admin-panel mt-8 flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        aria-label="Require invite setting"
      >
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-mist">
            Require invite code to sign up
          </p>
          <p className="mt-1 text-sm text-steel">
            {requireInviteCode
              ? "On — new members must enter a valid code."
              : "Off — codes stay optional (open bay)."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={requireInviteCode}
          aria-label="Require invite code to sign up"
          disabled={toggleBusy}
          onClick={() => void onToggleRequire(!requireInviteCode)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-4 py-2.5 font-display text-sm font-semibold transition disabled:opacity-60 ${
            requireInviteCode
              ? "border-lime/50 bg-lime/10 text-lime"
              : "border-white/15 text-mist hover:border-lime/40 hover:text-lime"
          }`}
        >
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              requireInviteCode ? "bg-lime" : "bg-steel"
            }`}
            aria-hidden
          />
          {requireInviteCode ? "Required" : "Optional"}
        </button>
      </section>

      <form
        onSubmit={(e) => void onCreate(e)}
        className="admin-panel mt-6 grid gap-4 rounded-md border p-4 sm:grid-cols-2 sm:p-5"
        aria-label="Create invite code"
      >
        <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel sm:col-span-2">
          Custom code (optional)
          <input
            className="rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Leave blank to auto-generate"
            maxLength={64}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
          Max uses (optional)
          <input
            className="rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
          Expires (optional)
          <input
            className="rounded-md border border-white/10 bg-bay-deep/80 px-3 py-2 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="bay-cta w-fit rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:col-span-2"
        >
          {busy ? "Working…" : "Create invite"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

      <form
        onSubmit={onSubmitSearch}
        className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
        role="search"
        aria-label="Search invite codes"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="font-display text-lg text-mist sm:text-xl">Find a code</h2>
          <p className="text-xs text-steel">Code or creator · filter as you type · stays in the URL</p>
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
              placeholder="Code or creator…"
              aria-label="Search invite codes by code or creator"
              autoComplete="off"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="submit"
                className="rounded-md bg-rose px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:brightness-110"
              >
                Search
              </button>
              {qFromUrl ? (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </label>

        <div className="mt-5 border-t border-white/8 pt-4">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Filter by status</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter invite codes by status"
          >
            {ADMIN_INVITES_GROUP_OPTIONS.map((option) => {
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
            Used/redeemed covers used-up, expired, and revoked codes.
          </p>
        </div>

        {filtersOn ? (
          <p className="mt-4 text-sm text-steel">
            Showing{" "}
            {!loading ? (
              <>
                {visible.length} of {invites.length}{" "}
                {invites.length === 1 ? "code" : "codes"}
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
                  {ADMIN_INVITES_GROUP_OPTIONS.find((o) => o.id === group)?.label}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </form>

      <div className="mt-8 mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-mist">Invite codes</h2>
        <p className="text-sm text-steel">
          {loading
            ? "Loading…"
            : `${visible.length} ${visible.length === 1 ? "code" : "codes"}`}
        </p>
      </div>

      {!loading && visible.length === 0 ? (
        <div className="play-panel rounded-md border px-5 py-12 text-center" role="status">
          {filtersOn ? (
            <>
              <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                No invite codes match
                {qFromUrl ? ` “${qFromUrl}”` : " that status filter"}. Try another spelling or clear
                the filters.
              </p>
              <button
                type="button"
                onClick={onClearFilters}
                className="bay-cta mt-6 inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="font-display text-xl text-mist sm:text-2xl">No invite codes yet</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                Create a code above for friends and family.
              </p>
            </>
          )}
        </div>
      ) : null}

      {visible.length > 0 ? (
        <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
          {visible.map((invite) => {
            const lifecycle = inviteLifecycle(invite);
            const status = inviteStatusLabel(lifecycle);
            const isActive = lifecycle === "active";
            return (
              <li
                key={invite.id}
                className="admin-row flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-mist">{invite.code}</p>
                  <p className="mt-1 text-sm text-steel">
                    <span className={isActive ? "text-lime" : undefined}>{status}</span>
                    {" · "}
                    {invite.usesCount}
                    {invite.maxUses != null ? ` / ${invite.maxUses}` : " uses"}
                    {invite.createdByDisplayName ? ` · by ${invite.createdByDisplayName}` : null}
                  </p>
                  <p className="mt-1 text-xs text-steel">
                    Created {new Date(invite.createdAt).toLocaleString()}
                    {invite.expiresAt
                      ? ` · expires ${new Date(invite.expiresAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => void onCopy(invite)}
                      aria-label={`Copy invite code ${invite.code}`}
                      className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2 font-display text-sm font-semibold text-lime transition hover:border-lime/60 hover:bg-lime/10"
                    >
                      {copiedId === invite.id ? "Copied" : "Copy"}
                    </button>
                  ) : null}
                  {!invite.revokedAt ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onRevoke(invite.id)}
                      className="rounded-md border border-rose/40 px-4 py-2 font-display text-sm text-rose transition hover:bg-rose/10 disabled:opacity-60"
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </AdminShell>
  );
}
