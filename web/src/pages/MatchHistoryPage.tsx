import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { MatchHistoryCar, MatchHistoryItem } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins } from "../cars";
import { CarVisual } from "../components/CarVisual";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import {
  formatMatchCarTitle,
  matchResultLabel,
  topTrumpsCategoryLabel,
} from "../match-history-labels";
import {
  matchHistoryOpenCarHref,
  matchHistoryOpenCarLabel,
} from "../match-history-open-car";
import {
  matchHistoryOpenOpponentHref,
  matchHistoryOpenOpponentLabel,
} from "../match-history-open-opponent";
import {
  matchHistoryRematchHref,
  matchHistoryRematchLabel,
} from "../match-history-rematch";
import {
  filterPlayHistoryByResult,
  parsePlayHistoryResultGroup,
  PLAY_HISTORY_RESULT_OPTIONS,
  type PlayHistoryResultGroup,
} from "../play-history-result-filter";

/** History payload has make/model but not paint — Midnight Black keeps studio thumbs on-brand. */
const HISTORY_STUDIO_COLOUR = "Midnight Black";

function resultTextClass(result: MatchHistoryItem["result"]): string {
  switch (result) {
    case "win":
      return "text-lime";
    case "loss":
      return "text-rose";
    case "draw":
      return "text-mist";
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}

function resultBadgeClass(result: MatchHistoryItem["result"]): string {
  switch (result) {
    case "win":
      return "border-lime/45 bg-lime/10 text-lime";
    case "loss":
      return "border-rose/45 bg-rose/10 text-rose";
    case "draw":
      return "border-white/20 bg-bay-panel/60 text-mist";
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}

function resultRowClass(result: MatchHistoryItem["result"]): string {
  switch (result) {
    case "win":
      return "border-lime/35 shadow-[inset_3px_0_0_0_rgba(163,230,53,0.85)]";
    case "loss":
      return "border-rose/35 shadow-[inset_3px_0_0_0_rgba(251,113,133,0.85)]";
    case "draw":
      return "border-white/15 shadow-[inset_3px_0_0_0_rgba(226,232,240,0.35)]";
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}

function MatchCarThumb({
  car,
  side,
}: {
  car: MatchHistoryCar;
  side: "you" | "them";
}) {
  const title = formatMatchCarTitle(car);
  const body = (
    <>
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md border border-white/10 bg-bay-deep/50 sm:h-[4.5rem] sm:w-32">
        <CarVisual
          colour={HISTORY_STUDIO_COLOUR}
          make={car.make}
          model={car.model}
          size="thumb"
          title={title}
          className="!h-full !w-full !rounded-none !border-0"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-steel">
          {side === "you" ? "Your car" : "Their car"}
        </p>
        <p className="mt-1 font-display text-sm text-mist">{title}</p>
        <p className="mt-0.5 text-xs text-steel">Value {car.value}</p>
      </div>
    </>
  );

  if (car.listingId != null) {
    return (
      <Link
        to={`/cars/${car.listingId}`}
        className="flex items-center gap-3 rounded-md border border-white/10 bg-bay-deep/40 px-3 py-2 no-underline transition hover:border-lime/35"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-bay-deep/40 px-3 py-2">
      {body}
    </div>
  );
}

function MatchHistoryRowActions({
  match,
  viewerUserId,
}: {
  match: MatchHistoryItem;
  viewerUserId: number | null;
}) {
  const yourCarHref = matchHistoryOpenCarHref(match.yourCar);
  const theirCarHref = matchHistoryOpenCarHref(match.theirCar);
  const opponentHref = matchHistoryOpenOpponentHref(match, viewerUserId);
  const rematchHref = matchHistoryRematchHref(match, viewerUserId);
  if (!yourCarHref && !theirCarHref && !opponentHref && !rematchHref) return null;

  const openCarClass =
    "rounded-md border border-white/15 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime";

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {yourCarHref ? (
        <Link
          to={yourCarHref}
          className={openCarClass}
          aria-label={`Open car ${formatMatchCarTitle(match.yourCar)}`}
        >
          {matchHistoryOpenCarLabel()}
        </Link>
      ) : null}
      {theirCarHref ? (
        <Link
          to={theirCarHref}
          className={openCarClass}
          aria-label={`Open car ${formatMatchCarTitle(match.theirCar)}`}
        >
          {matchHistoryOpenCarLabel()}
        </Link>
      ) : null}
      {opponentHref ? (
        <Link
          to={opponentHref}
          className="rounded-md border border-lime/35 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
          aria-label={`${matchHistoryOpenOpponentLabel()} ${match.opponentName}`}
        >
          {matchHistoryOpenOpponentLabel()}
        </Link>
      ) : null}
      {rematchHref ? (
        <Link
          to={rematchHref}
          className="rounded-md border border-lime/40 bg-bay-panel/70 px-3 py-1.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
          aria-label={
            match.mode === "house" ? "Rematch vs house" : `Rematch ${match.opponentName}`
          }
        >
          {matchHistoryRematchLabel(match)}
        </Link>
      ) : null}
    </div>
  );
}

export function MatchHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultGroup = parsePlayHistoryResultGroup(searchParams.get("result"));
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const visible = useMemo(
    () => filterPlayHistoryByResult(matches, resultGroup),
    [matches, resultGroup],
  );
  const filtersOn = resultGroup !== "all";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.fetchTopTrumpsHistory(40);
        if (!cancelled) {
          setMatches(res.matches);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load match history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function setResultGroup(next: PlayHistoryResultGroup) {
    const params = new URLSearchParams();
    if (next !== "all") params.set("result", next);
    setSearchParams(params, { replace: true });
  }

  function onClearFilters() {
    setResultGroup("all");
  }

  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.filter((m) => m.result === "loss").length;
  const draws = matches.filter((m) => m.result === "draw").length;

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">
              Top Trumps · Midnight garage
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Match history
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full sm:w-28" />
            <p className="mt-4 text-sm leading-relaxed text-steel sm:text-base">
              Past matches — opponent, category, clearer win or loss, and the cars you both put up.
              Newest first.
            </p>
            {!loading && matches.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Match result summary">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  {wins} win{wins === 1 ? "" : "s"}
                </span>
                <span className="rounded-md border border-rose/35 bg-rose/10 px-3 py-1.5 font-display text-xs font-semibold text-rose">
                  {losses} loss{losses === 1 ? "" : "es"}
                </span>
                <span className="rounded-md border border-white/12 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {draws} draw{draws === 1 ? "" : "s"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/play"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              ← Back to Play
            </Link>
            <Link
              to="/leaderboard"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Leaderboard
            </Link>
          </div>
        </header>

        {matches.length > 0 || filtersOn ? (
          <section
            className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
            aria-labelledby="match-history-filter-heading"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2
                id="match-history-filter-heading"
                className="font-display text-lg text-mist sm:text-xl"
              >
                Filter results
              </h2>
              <p className="text-xs text-steel">Stays in the URL</p>
            </div>
            <div className="mt-4">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Result</p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter matches by result"
              >
                {PLAY_HISTORY_RESULT_OPTIONS.map((option) => {
                  const active = resultGroup === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setResultGroup(option.id)}
                      className={`rounded-md border px-3 py-1.5 font-display text-sm transition ${
                        active
                          ? "border-lime/50 bg-lime/10 text-lime"
                          : "border-white/15 text-mist hover:border-lime/35 hover:text-lime"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {filtersOn ? (
              <p className="mt-4 text-sm text-steel">
                Showing{" "}
                {!loading ? (
                  <>
                    {visible.length} of {matches.length}{" "}
                    {matches.length === 1 ? "match" : "matches"}
                  </>
                ) : (
                  "…"
                )}{" "}
                ·{" "}
                <span className="font-display text-lime">
                  {PLAY_HISTORY_RESULT_OPTIONS.find((o) => o.id === resultGroup)?.label}
                </span>
              </p>
            ) : null}
          </section>
        ) : null}

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {!loading && matches.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-8 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="Empty match history bay"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">Empty bay</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              No matches yet. Face the house or challenge a member — Rematch will show up here after
              you play.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/play"
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Play
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && matches.length > 0 && filtersOn && visible.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-8 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="No matching match history"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              No{" "}
              {resultGroup === "wins" ? "wins" : resultGroup === "losses" ? "losses" : "matches"} in
              this filter. Clear the filter to see the full reel — Rematch stays on rows with a
              challengable opponent.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onClearFilters}
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
              >
                Clear filter
              </button>
              <Link
                to="/play"
                className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                Play
              </Link>
            </div>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <ul
            className="bay-rise-delay mt-8 flex flex-col gap-3"
            aria-label="Top Trumps match history"
          >
            {visible.map((match) => (
              <li
                key={match.id}
                className={`play-panel rounded-md border p-4 text-sm sm:p-5 ${resultRowClass(match.result)}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base text-mist">vs {match.opponentName}</p>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                          match.mode === "house"
                            ? "border-lime/30 text-lime"
                            : "border-rose/35 text-rose"
                        }`}
                      >
                        {match.mode === "house" ? "House" : "Challenge"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-steel">
                      {topTrumpsCategoryLabel(match.category)} ·{" "}
                      {new Date(match.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-md border px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-wide ${resultBadgeClass(match.result)}`}
                    >
                      {matchResultLabel(match.result)}
                    </span>
                    <p className={`mt-1.5 font-display text-sm ${resultTextClass(match.result)}`}>
                      +{formatCoins(match.coinReward)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <MatchCarThumb car={match.yourCar} side="you" />
                  <MatchCarThumb car={match.theirCar} side="them" />
                </div>
                <MatchHistoryRowActions match={match} viewerUserId={user?.id ?? null} />
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
