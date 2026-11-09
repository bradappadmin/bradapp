import { useEffect, useState, type FormEvent } from "react";
import * as api from "../../api";
import type { FamilyInvite } from "../../api";
import { AdminGuard } from "../../components/AdminGuard";
import { AdminShell } from "../../components/AdminShell";

export function AdminInvitesPage() {
  return (
    <AdminGuard>
      <AdminInvitesInner />
    </AdminGuard>
  );
}

function statusLabel(invite: FamilyInvite): string {
  if (invite.revokedAt) return "Revoked";
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= Date.now()) return "Expired";
  if (invite.maxUses != null && invite.usesCount >= invite.maxUses) return "Used up";
  return "Active";
}

function AdminInvitesInner() {
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function reload() {
    const res = await api.fetchAdminInvites();
    setInvites(res.invites);
  }

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load invites");
    });
  }, []);

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
    try {
      await navigator.clipboard.writeText(invite.code);
      setCopiedId(invite.id);
      setMessage(`Copied ${invite.code}.`);
      window.setTimeout(() => setCopiedId((current) => (current === invite.id ? null : current)), 2000);
    } catch {
      setError("Could not copy — select the code manually.");
    }
  }

  return (
    <AdminShell
      title="Family invites"
      description="Create optional invite codes for friends and family. Sign-up still works without a code — codes are for sharing a bay welcome, not locking the gate."
    >
      <form
        onSubmit={(e) => void onCreate(e)}
        className="admin-panel mt-8 grid gap-4 rounded-md border p-4 sm:grid-cols-2 sm:p-5"
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

      <ul className="mt-10 divide-y divide-white/10 border-t border-white/10">
        {invites.map((invite) => {
          const status = statusLabel(invite);
          return (
            <li
              key={invite.id}
              className="admin-row flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-mist">{invite.code}</p>
                <p className="mt-1 text-sm text-steel">
                  <span className={status === "Active" ? "text-lime" : undefined}>{status}</span>
                  {" · "}
                  {invite.usesCount}
                  {invite.maxUses != null ? ` / ${invite.maxUses}` : " uses"}
                  {invite.createdByDisplayName ? ` · by ${invite.createdByDisplayName}` : null}
                </p>
                <p className="mt-1 text-xs text-steel">
                  Created {new Date(invite.createdAt).toLocaleString()}
                  {invite.expiresAt ? ` · expires ${new Date(invite.expiresAt).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onCopy(invite)}
                  className="rounded-md border border-white/15 px-4 py-2 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                >
                  {copiedId === invite.id ? "Copied" : "Copy"}
                </button>
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
      {invites.length === 0 ? <p className="mt-4 text-sm text-steel">No invite codes yet.</p> : null}
    </AdminShell>
  );
}
