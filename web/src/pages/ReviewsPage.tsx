import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { ReviewSummary } from "../api";
import { useAuth } from "../auth-context";
import { FeaturedReview } from "../components/FeaturedReview";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { ReviewCarsMedia, reviewCarsCaption } from "../components/ReviewCarsMedia";
import { SiteHeader } from "../components/SiteHeader";
import {
  filterReviewsByCarQuery,
  parseReviewsTypeFilter,
  REVIEWS_TYPE_FILTERS,
  type ReviewsTypeFilter,
} from "../reviews-car-filter";

const fieldClass =
  "w-full rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

export function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = parseReviewsTypeFilter(searchParams.get("type"));
  const qFromUrl = (searchParams.get("q") ?? "").trim();
  const [draft, setDraft] = useState(qFromUrl);
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const visible = useMemo(
    () => filterReviewsByCarQuery(reviews, qFromUrl),
    [reviews, qFromUrl],
  );
  const filtersOn = Boolean(qFromUrl) || typeFilter !== "all";

  function writeParams(nextQ: string, nextType: ReviewsTypeFilter) {
    const params = new URLSearchParams();
    const q = nextQ.trim();
    if (q) params.set("q", q);
    if (nextType !== "all") params.set("type", nextType);
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
      setSearchParams(params, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [draft, qFromUrl, typeFilter, setSearchParams]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    writeParams(draft, typeFilter);
  }

  function onClearSearch() {
    setDraft("");
    writeParams("", typeFilter);
  }

  function onClearFilters() {
    setDraft("");
    writeParams("", "all");
  }

  function setTypeFilter(next: ReviewsTypeFilter) {
    writeParams(qFromUrl, next);
  }

  const emptyMessage = qFromUrl
    ? null
    : typeFilter === "drag_race"
      ? "No drag races published yet."
      : typeFilter === "review"
        ? "No cue-card reviews published yet."
        : "No reviews published yet.";

  const admin = Boolean(user && isAdmin(user.role));

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

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-8 text-sm text-rose">{error}</p> : null}

        <div className="mt-8 mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl text-mist">All reviews</h2>
          {!loading ? (
            <p className="text-sm text-steel">
              {visible.length} {visible.length === 1 ? "result" : "results"}
            </p>
          ) : null}
        </div>

        {!loading && visible.length === 0 ? (
          <div className="play-panel rounded-md border px-5 py-12 text-center" role="status">
            {qFromUrl || (typeFilter !== "all" && reviews.length > 0) ? (
              <>
                <p className="font-display text-xl text-mist sm:text-2xl">No matches</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                  No reviews match
                  {qFromUrl ? ` “${qFromUrl}”` : " that type filter"}. Try another spelling or clear
                  the filters.
                </p>
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="bay-cta mt-6 inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <p className="text-sm text-steel">{emptyMessage}</p>
            )}
          </div>
        ) : null}

        <ul className="flex flex-col gap-3">
          {visible.map((review) => (
            <li key={review.id}>
              <Link
                to={`/reviews/${review.id}`}
                className="play-panel flex gap-4 rounded-md border p-4 no-underline transition hover:border-lime/30 hover:bg-white/[0.02] sm:items-center sm:justify-between sm:p-5"
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
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
