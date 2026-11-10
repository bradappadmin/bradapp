import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import { AuthShell } from "../components/AuthShell";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

export function SignUpPage() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteFromUrl = (searchParams.get("invite") ?? "").trim();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(inviteFromUrl);
  const [requireInviteCode, setRequireInviteCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInviteCode(inviteFromUrl);
  }, [inviteFromUrl]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.fetchSignupOptions();
        if (!cancelled) setRequireInviteCode(Boolean(res.requireInviteCode));
      } catch {
        if (!cancelled) setRequireInviteCode(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (requireInviteCode && !inviteCode.trim()) {
      setError("A valid family invite code is required to sign up.");
      return;
    }
    setSubmitting(true);
    try {
      const { user: next } = await api.signUp({
        email,
        password,
        displayName,
        inviteCode: inviteCode.trim() || undefined,
      });
      setUser(next);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Friends and family join as members. Brad and Napwood already have admin seats."
      notes={
        <>
          <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
            Member signup
          </span>
          <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
            {requireInviteCode ? "Invite required" : "Invite optional"}
          </span>
        </>
      }
    >
      <div className="play-panel rounded-md border p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
            Display name
            <input
              className={fieldClass}
              type="text"
              autoComplete="nickname"
              required
              maxLength={120}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-label="Display name"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
            Email
            <input
              className={fieldClass}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
            Password
            <input
              className={fieldClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
            Family invite code{requireInviteCode ? "" : " (optional)"}
            <input
              className={fieldClass}
              type="text"
              autoComplete="off"
              maxLength={64}
              required={requireInviteCode}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder={
                requireInviteCode
                  ? "Required — ask Brad or Napwood"
                  : "If Brad or Napwood shared one"
              }
              aria-label={
                requireInviteCode ? "Family invite code" : "Family invite code (optional)"
              }
            />
          </label>
          {requireInviteCode ? (
            <p className="text-xs leading-relaxed text-steel">
              The bay is invite-only right now. Use a code from Brad or Napwood.
            </p>
          ) : null}
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="bay-cta mt-1 rounded-md bg-rose px-4 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Sign up"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-sm text-steel">
        Already have an account?{" "}
        <Link className="text-lime no-underline hover:underline" to="/signin">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
