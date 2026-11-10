import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { ReviewCar, ReviewSummary } from "../api";
import { useAuth } from "../auth-context";
import {
  ensureComparePick,
  loadCompareSelection,
  toggleComparePick,
  type ComparePick,
} from "../compare-selection";
import { CompareTray } from "../components/CompareTray";
import { FeaturedReview } from "../components/FeaturedReview";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { ReviewCarsMedia, reviewCarsCaption } from "../components/ReviewCarsMedia";
import { SiteHeader } from "../components/SiteHeader";
import { reviewCarComparePick, reviewCompareLabel } from "../review-compare";
import {
  filterReviewsByCarQuery,
  parseReviewsTypeFilter,
  REVIEWS_TYPE_FILTERS,
  type ReviewsTypeFilter,
} from "../reviews-car-filter";
import {
  DEFAULT_REVIEWS_SORT,
  parseReviewsSort,
  REVIEWS_SORT_OPTIONS,
  sortReviews,
  type ReviewsSort,
} from "../reviews-sort";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

export function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = parseReviewsTypeFilter(searchParams.get("type"));
  const sort = parseReviewsSort(searchParams.get("sort"));
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(qFromUrl);
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparePicks, setComparePicks] = useState<ComparePick[]>([]);

  useEffect(() => {
    setComparePicks(loadCompareSelection());
  }, []);

  function onCompareCar(car: ReviewCar) {
    const pick = reviewCarComparePick(car);
    if (!pick) return;
    const already = comparePicks.some((p) => p.id === pick.id);
    // Same session tray as Cars / Favourites / My cars / Recently viewed.
    const { picks } = already ? toggleComparePick(pick) : ensureComparePick(pick);
    setComparePicks(picks);
  }

  const filtered = useMemo(
    () => filterReviewsByCarQuery(reviews, qFromUrl),
    [reviews, qFromUrl],
  );
  const visible = useMemo(() => sortReviews(filtered, sort), [filtered, sort]);
  const filtersOn = Boolean(qFromUrl) || typeFilter !== "all";

  function writeParams(nextQ: string, nextType: ReviewsTypeFilter, nextSort: ReviewsSort) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextType !== "all") params.set("type", nextType);
    if (nextSort !== DEFAULT_REVIEWS_SORT) params.set("sort", nextSort);
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    setDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchReviews(
          isAdmin(user.role),
          undefined,
          typeFilter === "all" ? "all" : typeFilter,
        );
        if (!cancelled) {
          setReviews(res.reviews);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, typeFilter]);

  // Filter-as-you-type: debounce URL updates (client filter over the loaded list).
  useEffect(() => {
    const next = draft.trim();
    if (next === qFromUrl) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (next) params.set("q", next);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (sort !== DEFAULT_REVIEWS_SORT) params.set("sort", sort);
      setSearchParams(params, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, typeFilter, sort, setSearchParams]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeParams(draft, typeFilter, sort);
  }

  function onClearSearch() {
    setDraft("");
    writeParams("", typeFilter, sort);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("", "all", DEFAULT_REVIEWS_SORT);
  }

  function setTypeFilter(next: ReviewsTypeFilter) {
    writeParams(qFromUrl, next, sort);
  }

  function setSort(next: ReviewsSort) {
    writeParams(qFromUrl, typeFilter, next);
  }

  const admin = Boolean(user && isAdmin(user.role));
  // Find + type chips stay while loading, when the reel has films, or while a filter is active.
  const showFind = loading || reviews.length > 0 || filtersOn;

  let emptyTitle = "Empty bay";
  let emptyBody =
    "No cue-card reviews or drag races in the reel yet. Browse the catalogue for the cars Brad films — or check back after the next bay session.";
  if (filtersOn) {
    emptyTitle = "No matches";
    if (qFromUrl && typeFilter !== "all") {
      emptyBody = `No reviews match “${qFromUrl}” with that type filter. Try another spelling, clear filters, or browse the cars on film.`;
    } else if (qFromUrl) {
      emptyBody = `No reviews match “${qFromUrl}”. Try another spelling, clear filters, or browse the cars on film.`;
    } else if (typeFilter === "drag_race") {
      emptyBody =
        "No drag races in this filter. Clear filters for the full reel, or browse the cars Brad races.";
    } else if (typeFilter === "review") {
      emptyBody =
        "No cue-card reviews in this filter. Clear filters for the full reel, or browse the cars Brad films.";
    } else {
      emptyBody =
        "Nothing matches these filters. Clear them for the full reel, or browse the cars on film.";
    }
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
              Video reviews
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Brad in the bay — single-car cue-card reviews and head-to-head drag races. Original
              BradApp content with studio car photos.
            </p>
            {showFind || loading ? (
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Reviews bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  Cue cards
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  Drag races
                </span>
                {!loading ? (
                  <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                    {visible.length} {visible.length === 1 ? "film" : "films"}
                    {filtersOn ? " match" : ""}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          {admin ? (
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <Link
                to="/reviews/record"
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Record a review
              </Link>
              <p className="max-w-[14rem] text-xs text-steel sm:text-right">
                Admin bay — cue card or drag race, then publish.
              </p>
            </div>
          ) : null}
        </header>

        <FeaturedReview />

        {showFind ? (
          <form
            onSubmit={onSubmit}
            className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
            role="search"
            aria-label="Search reviews"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-lg text-mist sm:text-xl">Find a review</h2>
              <p className="text-xs text-steel">
                Make, model, or title · filter as you type · stays in the URL
              </p>
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
                  placeholder="Make, model, or title…"
                  aria-label="Search reviews by make, model, or title"
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
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-steel">Filter by type</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Review type">
                {REVIEWS_TYPE_FILTERS.map((filter) => {
                  const active = typeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTypeFilter(filter.id)}
                      className={`rounded-md border px-3 py-1.5 font-display text-sm transition ${
                        active
                          ? "border-lime/50 bg-lime/10 text-lime"
                          : "border-white/15 text-mist hover:border-lime/35 hover:text-lime"
                      }`}
                    >
                      {filter.label}
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
                    {visible.length} of {reviews.length}{" "}
                    {reviews.length === 1 ? "film" : "films"}
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
                {typeFilter !== "all" ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-display text-lime">
                      {REVIEWS_TYPE_FILTERS.find((f) => f.id === typeFilter)?.label}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
          </form>
        ) : null}

        {reviews.length > 0 ? (
          <div
            className="play-panel bay-rise-delay mt-6 rounded-md border p-4 sm:flex sm:items-end sm:justify-between sm:gap-4 sm:p-5"
            aria-label="Sort reviews reel"
          >
            <div className="min-w-0">
              <p className="font-display text-lg text-mist">Sort the bay</p>
              <p className="mt-1 text-sm text-steel">
                Newest or oldest first, or title A–Z / Z–A. Choice stays in the URL.
              </p>
            </div>
            <label className="mt-4 flex w-full flex-col gap-1.5 text-xs uppercase tracking-wide text-steel sm:mt-0 sm:w-56">
              Sort by
              <select
                className="w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2"
                value={sort}
                onChange={(e) => setSort(parseReviewsSort(e.target.value))}
                aria-label="Sort reviews"
              >
                {REVIEWS_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-8 text-sm text-rose">{error}</p> : null}

        {showFind && !loading ? (
          <div className="mt-8 mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl text-mist">All reviews</h2>
            <p className="text-sm text-steel">
              {visible.length} {visible.length === 1 ? "result" : "results"}
            </p>
          </div>
        ) : null}

        {!loading && visible.length === 0 ? (
          <div
            className={`play-panel rounded-md border px-5 py-12 text-center sm:py-14 ${
              showFind ? "" : "bay-rise-delay mt-10"
            }`}
            role="status"
            aria-label={filtersOn ? "No matching reviews" : "Empty reviews bay"}
          >
            <p className="font-display text-xl text-mist sm:text-2xl">{emptyTitle}</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">{emptyBody}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {filtersOn ? (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Clear filters
                </button>
              ) : null}
              <Link
                to="/cars"
                className={
                  filtersOn
                    ? "inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                    : "bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
                }
              >
                Browse cars
              </Link>
            </div>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {visible.map((review) => {
              const relatedCars = [review.car, review.carB].filter(
                (c): c is ReviewCar => c != null && c.listingId != null,
              );
              const hasActions = relatedCars.length > 0;

              return (
                <li key={review.id}>
                  <div className="play-panel overflow-hidden rounded-md border transition hover:border-lime/30 hover:bg-white/[0.02]">
                    <Link
                      to={`/reviews/${review.id}`}
                      className="flex gap-4 p-4 no-underline sm:items-center sm:justify-between sm:p-5"
                    >
                      <ReviewCarsMedia
                        type={review.type ?? "review"}
                        car={review.car}
                        carB={review.carB ?? null}
                        className="w-28 shrink-0 sm:w-40"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-semibold text-mist">{review.title}</p>
                        <p className="mt-1 text-sm text-steel">
                          {review.type === "drag_race" ? (
                            <span className="mr-2 rounded border border-rose/35 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose">
                              Drag race
                            </span>
                          ) : (
                            <span className="mr-2 rounded border border-lime/35 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lime">
                              Cue card
                            </span>
                          )}
                          {reviewCarsCaption(review.type ?? "review", review.car, review.carB ?? null)} ·{" "}
                          {review.publisher.displayName}
                          {review.status === "unpublished" ? " · unpublished" : ""}
                          {review.featured ? " · featured" : ""}
                          {" · "}
                          {review.likeCount === 1 ? "1 like" : `${review.likeCount} likes`}
                        </p>
                        <p className="mt-1 text-xs text-steel sm:hidden">
                          {new Date(review.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="hidden shrink-0 text-xs text-steel sm:block">
                        {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </Link>
                    {hasActions ? (
                      <div
                        className="flex flex-wrap gap-2 border-t border-white/8 px-4 pb-4 sm:px-5 sm:pb-5"
                        aria-label="Related car actions"
                      >
                        {relatedCars.map((car) => {
                          const pick = reviewCarComparePick(car);
                          const selected =
                            pick != null && comparePicks.some((p) => p.id === pick.id);
                          return (
                            <span
                              key={`${review.id}-${car.listingId}`}
                              className="flex flex-wrap gap-2"
                            >
                              <Link
                                to={`/cars/${car.listingId}`}
                                aria-label={`Open car ${car.make} ${car.model}`}
                                className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                              >
                                Open car
                              </Link>
                              {pick ? (
                                <button
                                  type="button"
                                  aria-pressed={selected}
                                  aria-label={
                                    selected
                                      ? `Remove ${car.make} ${car.model} from compare`
                                      : `Compare ${car.make} ${car.model}`
                                  }
                                  onClick={() => onCompareCar(car)}
                                  className={`rounded-md border px-3 py-1.5 font-display text-sm font-semibold transition ${
                                    selected
                                      ? "border-lime/50 text-lime hover:bg-lime/10"
                                      : "border-white/15 text-steel hover:border-lime/40 hover:text-lime"
                                  }`}
                                >
                                  {reviewCompareLabel(selected)}
                                </button>
                              ) : null}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        <CompareTray picks={comparePicks} onChange={setComparePicks} />
      </main>
    </div>
  );
}
