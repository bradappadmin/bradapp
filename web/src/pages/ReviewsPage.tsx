import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { ReviewSummary } from "../api";
import { useAuth } from "../auth-context";
import { SiteHeader } from "../components/SiteHeader";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

export function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchReviews(isAdmin(user.role));
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
  }, [user?.id, user?.role]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="bay-rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">Video reviews</h1>
            <p className="mt-2 max-w-xl text-sm text-steel">
              Brad in the bay — car reviews with cue cards. Original BradApp content, not Carwow.
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

        {loading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-8 text-sm text-rose">{error}</p> : null}

        <ul className="mt-8 divide-y divide-white/10 border-t border-white/10">
          {reviews.map((review) => (
            <li key={review.id}>
              <Link
                to={`/reviews/${review.id}`}
                className="flex flex-col gap-1 py-5 no-underline transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-lg font-semibold text-mist">{review.title}</p>
                  <p className="mt-1 text-sm text-steel">
                    {review.car.make} {review.car.model}
                    {review.car.trimName ? ` ${review.car.trimName}` : ""} · {review.publisher.displayName}
                    {review.status === "unpublished" ? " · unpublished" : ""}
                  </p>
                </div>
                <p className="text-xs text-steel">{new Date(review.createdAt).toLocaleString()}</p>
              </Link>
            </li>
          ))}
        </ul>
        {!loading && reviews.length === 0 ? (
          <p className="mt-6 text-sm text-steel">No reviews published yet.</p>
        ) : null}
      </main>
    </div>
  );
}
