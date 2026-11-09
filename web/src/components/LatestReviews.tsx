import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api";
import type { ReviewSummary } from "../api";
import { ReviewCarThumb } from "./ReviewCarThumb";

const HOME_REVIEW_LIMIT = 4;

export function LatestReviews() {
  const [reviews, setReviews] = useState<ReviewSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchReviews(false, HOME_REVIEW_LIMIT);
        if (!cancelled) {
          setReviews(res.reviews.filter((r) => r.status === "published" && !r.featured));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load reviews");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="bay-rise-delay mt-10 border-t border-white/10 pt-8"
      aria-label="Latest bay reviews"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-mist">Latest reviews</h2>
          <p className="mt-1 text-sm text-steel">Fresh from the bay — open one to watch.</p>
        </div>
        <Link to="/reviews" className="font-display text-sm text-lime no-underline hover:underline">
          All reviews
        </Link>
      </div>

      {loading ? <p className="mt-5 text-sm text-steel">Loading…</p> : null}
      {error ? <p className="mt-5 text-sm text-rose">{error}</p> : null}

      {!loading && !error && reviews.length === 0 ? (
        <p className="mt-5 text-sm text-steel">No reviews published yet.</p>
      ) : null}

      {reviews.length > 0 ? (
        <ul className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="bay-rise">
              <Link
                to={`/reviews/${review.id}`}
                className="group block overflow-hidden rounded-md border border-white/10 bg-bay-panel/50 no-underline transition hover:border-lime/35 hover:bg-bay-panel/80"
              >
                <ReviewCarThumb
                  car={review.car}
                  size="card"
                  className="aspect-[16/10] w-full border-b border-white/10"
                />
                <div className="p-3 sm:p-4">
                  <p className="font-display text-base font-semibold text-mist group-hover:text-white">
                    {review.title}
                  </p>
                  <p className="mt-1 text-sm text-steel">
                    {review.car.make} {review.car.model}
                    {review.car.trimName ? ` ${review.car.trimName}` : ""} ·{" "}
                    {review.publisher.displayName}
                    {" · "}
                    {review.likeCount === 1 ? "1 like" : `${review.likeCount ?? 0} likes`}
                  </p>
                  <p className="mt-3 font-display text-sm text-lime">Watch →</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
