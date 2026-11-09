import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { MemberSummary } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

export function MembersPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(qFromUrl);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchMembers(qFromUrl ? { q: qFromUrl } : undefined);
        if (!cancelled) {
          setMembers(res.members);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qFromUrl]);

  // Filter-as-you-type: debounce URL updates so the server `q` stays in sync.
  useEffect(() => {
    const next = draft.trim();
    if (next === qFromUrl) return;
    const timer = window.setTimeout(() => {
      if (next) setSearchParams({ q: next }, { replace: true });
      else setSearchParams({}, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, setSearchParams]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    if (next) setSearchParams({ q: next }, { replace: true });
    else setSearchParams({}, { replace: true });
  }

  function onClear() {
    setDraft("");
    setSearchParams({}, { replace: true });
  }

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Members
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Public garages in the bay — name, bio, Brad Coins, and car count. Open a garage, then
              challenge or offer a free trade when signed in.
            </p>
            {!loading ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Members bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  Name search
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {members.length} {members.length === 1 ? "member" : "members"}
                  {qFromUrl ? " match" : " in the bay"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/leaderboard"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Leaderboard
            </Link>
            <Link
              to="/play"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Play
            </Link>
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
          role="search"
          aria-label="Search members"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="font-display text-lg text-mist sm:text-xl">Find a member</h2>
            <p className="text-xs text-steel">Filter as you type · stays in the URL</p>
          </div>
          <label className="mt-4 flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
            Search by name
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className={fieldClass}
                type="search"
                name="q"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Display name…"
                aria-label="Search members by display name"
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
                    onClick={onClear}
                    className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-lime/40 hover:text-lime"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </label>
          {qFromUrl ? (
            <p className="mt-3 text-sm text-steel">
              Showing matches for{" "}
              <span className="font-display text-lime">“{qFromUrl}”</span>
              {!loading ? (
                <>
                  {" "}
                  · {members.length} {members.length === 1 ? "member" : "members"}
                </>
              ) : null}
            </p>
          ) : null}
        </form>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        {!loading && members.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-8 rounded-md border px-5 py-12 text-center"
            role="status"
          >
            {qFromUrl ? (
              <>
                <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                  Nobody in the bay matches “{qFromUrl}”. Try another spelling or clear the search.
                </p>
                <button
                  type="button"
                  onClick={onClear}
                  className="bay-cta mt-6 inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="font-display text-xl text-mist sm:text-2xl">No members yet</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                  The bay directory is empty right now. Check back after friends and family sign up.
                </p>
              </>
            )}
          </div>
        ) : null}

        {members.length > 0 ? (
          <section className="bay-rise-delay mt-10" aria-labelledby="members-directory">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="members-directory" className="font-display text-xl text-mist">
                Directory
              </h2>
              <p className="text-sm text-steel">
                {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {members.map((member) => {
                const isYou = Boolean(user && member.id === user.id);
                const canAct = Boolean(user && !isYou && member.carCount > 0);
                return (
                  <li key={member.id} className="play-panel rounded-md border p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          to={`/members/${member.id}`}
                          className="font-display text-lg font-semibold text-mist no-underline transition hover:text-white"
                        >
                          {member.displayName}
                          {isYou ? " (you)" : ""}
                        </Link>
                        <p className="mt-1 text-sm text-steel">{member.roleLabel}</p>
                        {member.bio ? (
                          <p className="mt-1 max-w-md text-sm text-mist/90">{member.bio}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-display text-lime">
                          {formatCoins(member.coinBalance)}
                        </span>
                        <span className="text-steel">
                          {member.carCount} {member.carCount === 1 ? "car" : "cars"}
                        </span>
                        <Link
                          to={`/members/${member.id}`}
                          className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                        >
                          Open garage
                        </Link>
                        {canAct ? (
                          <>
                            <Link
                              to={`/play?opponent=${member.id}`}
                              className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-sm text-lime no-underline transition hover:bg-lime/10"
                            >
                              Challenge
                            </Link>
                            <Link
                              to={`/trades?with=${member.id}`}
                              className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                            >
                              Trade
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
