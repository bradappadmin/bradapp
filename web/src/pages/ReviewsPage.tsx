import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { ReviewSummary, ReviewType } from "../api";
import { useAuth } from "../auth-context";
import { FeaturedReview } from "../components/FeaturedReview";
import { ReviewCarsMedia, reviewCarsCaption } from "../components/ReviewCarsMedia";
import { SiteHeader } from "../components/SiteHeader";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

type ReviewTypeFilter = "all" | ReviewType;

const FILTERS: Array<{ id: ReviewTypeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "review", label: "Cue card" },
  { id: "drag_race", label: "Drag race" },
];

function parseTypeFilter(raw: string | null): ReviewTypeFilter {
  if (raw === "review" || raw === "drag_race") return raw;
  return "all";
}

export function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = parseTypeFilter(searchParams.get("type"));
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function setTypeFilter(next: ReviewTypeFilter) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") params.delete("type");
        else params.set("type", next);
        return params;
      },
      { replace: true },
    );
  }

  const emptyMessage =
    typeFilter === "drag_race"
      ? "No drag races published yet."
      : typeFilter === "review"
        ? "No cue-card reviews published yet."
        : "No reviews published yet.";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="bay-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">Video reviews</h1>
            <p className="mt-2 max-w-xl text-sm text-steel">
              Brad in the bay — single-car cue-card reviews and drag races. Original BradApp
              content.
            </p>
          </div>
          {user && isAdmin(user.role) ? (
            <Link
              to="/reviews/record"
              className="bay-cta rounded-md bg-rose px-4 py-2.5 font-display text-sm font-semibold text-white no-underline"
            >
              Record a review
            </Link>
          ) : null}
        </div>

        <FeaturedReview />

        <div className="mt-10 border-t border-white/10 pt-6">
          <fieldset>
            <legend className="font-display text-xs uppercase tracking-wide text-steel">
              Filter by type
            </legend>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Review type">
              {FILTERS.map((filter) => {
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
          </fieldset>
        </div>

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-8 text-sm text-rose">{error}</p> : null}

        <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
          {reviews.map((review) => (
            <li key={review.id}>
              <Link
                to={`/reviews/${review.id}`}
                className="flex gap-4 py-5 no-underline transition hover:bg-white/[0.02] sm:items-center sm:justify-between"
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
                      <span className="mr-2 text-lime">Drag race</span>
                    ) : (
                      <span className="mr-2 text-mist/80">Cue card</span>
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
        {!loading && reviews.length === 0 ? (
          <p className="mt-6 text-sm text-steel">{emptyMessage}</p>
        ) : null}
      </main>
    </div>
  );
}
