import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import { AuthShell } from "../components/AuthShell";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

export function SignInPage() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user: next } = await api.signIn({ email, password });
      setUser(next);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Open the bay with your BradApp account — friends and family, Brad, or Napwood."
      notes={
        <>
          <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
            Existing accounts
          </span>
          <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
            Brad Coins stay in the bay
          </span>
        </>
      }
    >
      <div className="play-panel rounded-md border p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-steel">
          Brad signs in as{" "}
          <button
            type="button"
            className="border-0 bg-transparent p-0 font-inherit text-lime underline"
            onClick={() => setEmail("bradapp.admin@gmail.com")}
          >
            bradapp.admin@gmail.com
          </button>
          . Friends create their own accounts.
        </p>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />
          </label>
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="bay-cta mt-1 rounded-md bg-rose px-4 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-sm text-steel">
        New here?{" "}
        <Link className="text-lime no-underline hover:underline" to="/signup">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
