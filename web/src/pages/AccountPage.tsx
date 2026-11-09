import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import { BIO_MAX_LENGTH } from "../api";
import { useAuth } from "../auth-context";
import { SiteHeader } from "../components/SiteHeader";
import { roleLabel } from "../types";

export function AccountPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    setBio(user.bio ?? "");
  }, [user?.id, user?.displayName, user?.bio]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    const name = displayName.trim();
    if (!name) {
      setProfileError("Display name is required.");
      return;
    }
    if (bio.trim().length > BIO_MAX_LENGTH) {
      setProfileError(`Bio must be ${BIO_MAX_LENGTH} characters or fewer.`);
      return;
    }
    setProfileBusy(true);
    try {
      const res = await api.updateProfile({ displayName: name, bio: bio.trim() });
      setUser(res.user);
      setProfileMessage("Bay name and bio saved. Friends see them on your garage.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setProfileBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      setMessage("Password updated. Use the new one next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-mist outline-none ring-lime/40 focus:ring-2";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Account</h1>
          {user ? (
            <p className="mt-2 text-sm text-steel">
              {user.displayName} · {user.email} · {roleLabel(user.role)}
            </p>
          ) : null}
        </div>

        <section className="bay-rise-delay mt-10 border-t border-white/10 pt-8">
          <h2 className="font-display text-xl text-mist">Bay profile</h2>
          <p className="mt-2 text-sm text-steel">
            Your display name and short bio show on your public garage, the members list, and
            challenges. Email stays private (admins can still see it).
          </p>

          <form onSubmit={(e) => void onSaveProfile(e)} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm text-steel">
              Display name
              <input
                className={fieldClass}
                type="text"
                maxLength={120}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-steel">
              Garage bio
              <textarea
                className={`${fieldClass} min-h-[5.5rem] resize-y`}
                maxLength={BIO_MAX_LENGTH}
                placeholder="A short line about your bay…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <span className="text-xs text-steel">
                {bio.trim().length}/{BIO_MAX_LENGTH}
              </span>
            </label>
            {profileError ? <p className="text-sm text-rose">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm text-lime">{profileMessage}</p> : null}
            <button
              type="submit"
              disabled={profileBusy}
              className="bay-cta rounded-md bg-rose px-4 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {profileBusy ? "Saving…" : "Save bay profile"}
            </button>
          </form>
          {user ? (
            <p className="mt-4 text-sm text-steel">
              Preview your garage:{" "}
              <Link
                to={`/members/${user.id}`}
                className="text-lime no-underline hover:underline"
              >
                Open public garage
              </Link>
            </p>
          ) : null}
        </section>

        <section className="bay-rise-delay mt-10 border-t border-white/10 pt-8">
          <h2 className="font-display text-xl text-mist">Brad Coins</h2>
          {user ? (
            <p className="mt-2 font-display text-2xl text-lime">{user.coinBalance.toLocaleString()} BC</p>
          ) : null}
          <p className="mt-2 text-sm text-steel">
            See every in and out — starter, buys, sells, daily, play, and admin adjusts.
          </p>
          <Link
            to="/ledger"
            className="mt-4 inline-block rounded-md border border-lime/40 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
          >
            Open coin ledger
          </Link>
        </section>

        <section className="bay-rise-delay mt-10 border-t border-white/10 pt-8">
          <h2 className="font-display text-xl text-mist">Change password</h2>
          <p className="mt-2 text-sm text-steel">
            Enter your current password, then choose a new one. Stored as a bcrypt hash only — never
            in plaintext.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm text-steel">
              Current password
              <input
                className={fieldClass}
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-steel">
              New password
              <input
                className={fieldClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-steel">
              Confirm new password
              <input
                className={fieldClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-rose">{error}</p> : null}
            {message ? <p className="text-sm text-lime">{message}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="bay-cta mt-1 rounded-md bg-rose px-4 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>

        <p className="mt-10 text-sm text-steel">
          <Link to="/" className="text-lime no-underline hover:underline">
            ← Back home
          </Link>
        </p>
      </main>
    </div>
  );
}
