import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { LeaderboardEntry, WeeklyCupSnapshot } from "../api";
import { useAuth } from "../auth-context";
import { bioSnippet } from "../bio-snippet";
import { formatCoins, listingTitle } from "../cars";
import { CarVisual } from "../components/CarVisual";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { WeeklyCupPanel } from "../components/WeeklyCupPanel";
import {
  filterLeaderboardMembers,
  matchesLeaderboardMemberQuery,
} from "../leaderboard-member-filter";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

function podiumRankClass(rank: number): string {
  switch (rank) {
    case 1:
      return "border-lime/45 bg-lime/15 text-lime";
    case 2:
      return "border-mist/35 bg-white/[0.06] text-mist";
    case 3:
      return "border-rose/40 bg-rose/10 text-rose";
    default:
      return "border-white/10 bg-bay-panel/50 text-steel";
  }
}

function rowPanelClass(rank: number, isYou: boolean): string {
  if (rank === 1) {
    return "border-lime/30 bg-lime/[0.06]";
  }
  if (rank === 2) {
    return "border-white/14 bg-bay-panel/55";
  }
  if (rank === 3) {
    return "border-rose/25 bg-rose/[0.05]";
  }
  if (isYou) {
    return "border-lime/20 bg-bay-panel/45";
  }
  return "border-white/10 bg-bay-panel/35";
}

export function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(qFromUrl);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [weeklyCup, setWeeklyCup] = useState<WeeklyCupSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const visible = useMemo(
    () => filterLeaderboardMembers(entries, qFromUrl),
    [entries, qFromUrl],
  );
  const filtersOn = Boolean(qFromUrl);

  useEffect(() => {
    setDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchLeaderboard();
        if (!cancelled) {
          setEntries(res.entries);
          setWeeklyCup(res.weeklyCup ?? null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Filter-as-you-type: debounce URL updates (client filter over the loaded list).
  useEffect(() => {
    const next = draft.trim();
    if (next === qFromUrl) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      setSearchParams(params, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, setSearchParams]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function writeParams(nextQ: string) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    setSearchParams(params, { replace: true });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeParams(draft);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("");
  }

  const topThree = entries.slice(0, 3);

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Brad Coin leaderboard
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Who’s richest in the bay. This week’s Top Trumps cup tracks London-week wins (+
              {weeklyCup?.prizeAmount ?? 50} BC prize). All-time ranks are by Brad Coin balance, with
              a highlight car and career wins.
            </p>
            {!loading ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Leaderboard bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  Ranked by coins
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {filtersOn ? visible.length : entries.length}{" "}
                  {(filtersOn ? visible.length : entries.length) === 1 ? "member" : "members"}
                  {filtersOn ? " match" : ""}
                </span>
                {weeklyCup ? (
                  <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                    Cup {weeklyCup.weekKey}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/members"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Members
            </Link>
            <Link
              to="/play"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Play
            </Link>
          </div>
        </header>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}

        <form
          onSubmit={onSubmit}
          className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
          role="search"
          aria-label="Search leaderboard members"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="font-display text-lg text-mist sm:text-xl">Find a member</h2>
            <p className="text-xs text-steel">Display name · filter as you type · stays in the URL</p>
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
                placeholder="Display name…"
                aria-label="Search leaderboard by display name"
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
          {filtersOn ? (
            <p className="mt-4 text-sm text-steel">
              Showing{" "}
              {!loading ? (
                <>
                  {visible.length} of {entries.length}{" "}
                  {entries.length === 1 ? "member" : "members"}
                </>
              ) : (
                "…"
              )}{" "}
              for <span className="font-display text-lime">“{qFromUrl}”</span>
              <span className="text-steel"> · podium stays on the full bay</span>
            </p>
          ) : null}
        </form>

        {!loading && (weeklyCup || topThree.length > 0) ? (
          <div className="bay-rise-delay mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
            {weeklyCup ? (
              <WeeklyCupPanel cup={weeklyCup} viewerId={user?.id} />
            ) : null}
            {topThree.length > 0 ? (
              <section aria-label="Top three on the podium">
                <p className="text-xs uppercase tracking-[0.2em] text-steel">All-time podium</p>
                <p className="mt-1 font-display text-lg text-mist sm:text-xl">Brad Coin ranks</p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {topThree.map((entry) => {
                    const isYou = Boolean(user && entry.id === user.id);
                    const isMatch = filtersOn && matchesLeaderboardMemberQuery(entry, qFromUrl);
                    return (
                      <li key={`podium-${entry.id}`}>
                        <Link
                          to={`/members/${entry.id}`}
                          className={`play-panel flex flex-col rounded-md border p-4 no-underline transition hover:border-lime/35 ${rowPanelClass(entry.rank, isYou)} ${
                            isMatch ? "ring-2 ring-lime/45" : filtersOn ? "opacity-55" : ""
                          }`}
                          aria-current={isMatch ? "true" : undefined}
                        >
                          <span
                            className={`inline-flex w-fit rounded-md border px-2.5 py-1 font-display text-xs font-semibold ${podiumRankClass(entry.rank)}`}
                          >
                            #{entry.rank}
                          </span>
                          <p className="mt-3 font-display text-base font-semibold text-mist">
                            {entry.displayName}
                            {isYou ? " (you)" : ""}
                          </p>
                          <p className="mt-1 font-display text-sm text-lime">
                            {formatCoins(entry.coinBalance)}
                          </p>
                          {isMatch ? (
                            <p className="mt-2 text-[10px] uppercase tracking-wide text-lime">
                              Match
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        <section className="bay-rise-delay mt-10" aria-labelledby="leaderboard-standings">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="leaderboard-standings" className="font-display text-xl text-mist">
              All-time standings
            </h2>
            {!loading ? (
              <p className="text-sm text-steel">
                {visible.length} {visible.length === 1 ? "row" : "rows"}
              </p>
            ) : null}
          </div>

          {!loading && visible.length === 0 ? (
            <div
              className="play-panel bay-rise-delay rounded-md border px-5 py-12 text-center sm:py-14"
              role="status"
              aria-label={filtersOn ? "No matching leaderboard members" : "Empty leaderboard bay"}
            >
              {filtersOn ? (
                <>
                  <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                    No standings match “{qFromUrl}”. Try another spelling or clear the filters —
                    podium and this week’s cup stay on the full bay above.
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
                <p className="text-sm text-steel">No members yet.</p>
              )}
            </div>
          ) : null}

          <ol className="flex flex-col gap-3">
            {visible.map((entry) => {
              const isYou = Boolean(user && entry.id === user.id);
              const canAct = Boolean(user && !isYou);
              const snippet = bioSnippet(entry.bio);
              const car = entry.highlightCar;
              const carTitle = car
                ? listingTitle({ make: car.make, model: car.model, trimName: car.trimName })
                : null;
              return (
                <li
                  key={entry.id}
                  className={`play-panel flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${rowPanelClass(entry.rank, isYou)}`}
                >
                  <Link
                    to={`/members/${entry.id}`}
                    className="group flex min-w-0 flex-1 items-center gap-3 no-underline sm:gap-4"
                    aria-label={`${entry.displayName}${isYou ? " (you)" : ""}, rank ${entry.rank}, open garage`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border font-display text-sm font-semibold sm:h-10 sm:w-10 sm:text-base ${podiumRankClass(entry.rank)}`}
                    >
                      #{entry.rank}
                    </span>

                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-bay-panel/60 sm:h-16 sm:w-28">
                      {car && carTitle ? (
                        <CarVisual
                          colour={car.colour}
                          bodyType={car.bodyType}
                          make={car.make}
                          model={car.model}
                          size="thumb"
                          title={carTitle}
                          className="!h-full !w-full !rounded-none !border-0"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center bg-gradient-to-b from-bay-panel to-bay-deep"
                          aria-hidden
                        >
                          <span className="font-display text-[10px] uppercase tracking-wide text-steel/80">
                            Empty bay
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold text-mist transition group-hover:text-white">
                        {entry.displayName}
                        {isYou ? " (you)" : ""}
                      </p>
                      {snippet ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-mist/85">{snippet}</p>
                      ) : (
                        <p className="mt-0.5 text-sm text-steel">{entry.roleLabel}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-display text-lime">{formatCoins(entry.coinBalance)}</span>
                        <span className="text-steel">
                          {entry.topTrumpsWins} Top Trumps{" "}
                          {entry.topTrumpsWins === 1 ? "win" : "wins"}
                        </span>
                      </div>
                    </div>
                  </Link>
                  {canAct ? (
                    <div className="flex shrink-0 flex-wrap gap-2 sm:self-center">
                      <Link
                        to={`/play?opponent=${entry.id}`}
                        className="rounded-md border border-lime/40 px-3 py-2 text-center font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
                        aria-label={`Challenge ${entry.displayName} to Top Trumps`}
                      >
                        Challenge to Top Trumps
                      </Link>
                      <Link
                        to={`/trades?with=${entry.id}`}
                        className="rounded-md border border-white/15 px-3 py-2 text-center font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                        aria-label={`Offer trade with ${entry.displayName}`}
                      >
                        Offer trade
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </div>
  );
}
