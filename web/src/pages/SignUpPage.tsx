import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import { AuthShell } from "../components/AuthShell";

export function SignUpPage() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [requireInviteCode, setRequireInviteCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-steel">
          Display name
          <input
            className="rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-mist outline-none ring-lime/40 focus:ring-2"
            type="text"
            autoComplete="nickname"
            required
            maxLength={120}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-steel">
          Email
          <input
            className="rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-mist outline-none ring-lime/40 focus:ring-2"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-steel">
          Password
          <input
            className="rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-mist outline-none ring-lime/40 focus:ring-2"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-steel">
          Family invite code{requireInviteCode ? "" : " (optional)"}
          <input
            className="rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-mist outline-none ring-lime/40 focus:ring-2"
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
          />
        </label>
        {requireInviteCode ? (
          <p className="text-xs text-steel">
            The bay is invite-only right now. Use a code from Brad or Napwood.
          </p>
        ) : null}
        {error ? <p className="text-sm text-rose">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="bay-cta mt-2 rounded-md bg-rose px-4 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-sm text-steel">
        Already have an account?{" "}
        <Link className="text-lime no-underline hover:underline" to="/signin">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
