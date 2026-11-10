import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import { BIO_MAX_LENGTH } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { garageSharePath } from "../share-link";
import { useToast } from "../toast-context";
import { roleLabel } from "../types";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

export function AccountPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const toast = useToast();
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
      const ok = "Bay name and bio saved. Friends see them on your garage.";
      setProfileMessage(ok);
      toast.success(ok);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save profile";
      setProfileError(msg);
      toast.error(msg);
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

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Account
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Bay profile, Brad Coins, and password — the panels friends and family use to keep their
              garage identity and sign-in in shape.
            </p>
            {user ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Account bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  {roleLabel(user.role)}
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {formatCoins(user.coinBalance)}
                </span>
                <span className="max-w-full truncate rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-steel">
                  {user.email}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/ledger"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Coin ledger
            </Link>
            <Link
              to="/garage"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              My cars
            </Link>
          </div>
        </header>

        <section
          className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
          aria-labelledby="bay-profile-heading"
        >
          <h2 id="bay-profile-heading" className="font-display text-lg text-mist sm:text-xl">
            Bay profile
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-steel">
            Your display name and short bio show on your public garage, the members list, and
            challenges. Email stays private (admins can still see it).
          </p>

          <form onSubmit={(e) => void onSaveProfile(e)} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Display name
              <input
                className={fieldClass}
                type="text"
                maxLength={120}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                aria-label="Display name"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Garage bio
              <textarea
                className={`${fieldClass} min-h-[5.5rem] resize-y`}
                maxLength={BIO_MAX_LENGTH}
                placeholder="A short line about your bay…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                aria-label="Garage bio"
              />
              <span className="normal-case tracking-normal text-xs text-steel">
                {bio.trim().length}/{BIO_MAX_LENGTH}
              </span>
            </label>
            {profileError ? <p className="text-sm text-rose">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm text-lime">{profileMessage}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                disabled={profileBusy}
                className="bay-cta rounded-md bg-rose px-4 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {profileBusy ? "Saving…" : "Save bay profile"}
              </button>
              {user ? (
                <>
                  <Link
                    to={`/members/${user.id}`}
                    className="rounded-md border border-white/15 px-4 py-2.5 text-center font-display text-sm text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                  >
                    Open public garage
                  </Link>
                  <CopyShareLinkButton
                    path={garageSharePath(user.id)}
                    label="Copy garage link"
                    className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm font-semibold text-mist transition hover:border-lime/40 hover:text-lime"
                  />
                </>
              ) : null}
            </div>
          </form>
        </section>

        <section
          className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:p-5"
          aria-labelledby="brad-coins-heading"
        >
          <h2 id="brad-coins-heading" className="font-display text-lg text-mist sm:text-xl">
            Brad Coins
          </h2>
          {user ? (
            <p className="mt-3 font-display text-3xl font-semibold text-lime">
              {formatCoins(user.coinBalance)}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-steel">
            See every in and out — starter, buys, sells, daily, play, and admin adjusts.
          </p>
          <Link
            to="/ledger"
            className="mt-4 inline-flex rounded-md border border-lime/40 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
          >
            Open coin ledger
          </Link>
        </section>

        <section
          className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:p-5"
          aria-labelledby="change-password-heading"
        >
          <h2 id="change-password-heading" className="font-display text-lg text-mist sm:text-xl">
            Change password
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-steel">
            Enter your current password, then choose a new one. Stored as a bcrypt hash only — never
            in plaintext.
          </p>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Current password
              <input
                className={fieldClass}
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                aria-label="Current password"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              New password
              <input
                className={fieldClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                aria-label="New password"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Confirm new password
              <input
                className={fieldClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label="Confirm new password"
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
