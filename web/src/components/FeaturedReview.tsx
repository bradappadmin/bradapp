import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api";
import type { ReviewSummary } from "../api";
import { ReviewCarsMedia, reviewCarsCaption } from "./ReviewCarsMedia";

export function FeaturedReview() {
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.fetchFeaturedReview();
        if (!cancelled) {
          setReview(res.review && res.review.status === "published" ? res.review : null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load featured review");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || error || !review) {
    return null;
  }

  return (
    <section
      className="bay-rise-delay mt-10 border-t border-white/10 pt-8"
      aria-label="Featured bay review"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-steel">Featured</p>
      <h2 className="mt-2 font-display text-xl text-mist">Pinned from the bay</h2>
      <p className="mt-1 text-sm text-steel">Brad’s pick — open it to watch.</p>

      <Link
        to={`/reviews/${review.id}`}
        className="mt-5 grid gap-4 border-t border-white/10 py-5 no-underline transition hover:bg-white/[0.02] sm:grid-cols-[minmax(0,14rem)_1fr_auto] sm:items-center"
      >
        <ReviewCarsMedia
          type={review.type ?? "review"}
          car={review.car}
          carB={review.carB ?? null}
          size="card"
        />
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-mist">{review.title}</p>
          <p className="mt-1 text-sm text-steel">
            {review.type === "drag_race" ? (
              <span className="mr-2 text-lime">Drag race</span>
            ) : null}
            {reviewCarsCaption(review.type ?? "review", review.car, review.carB ?? null)} ·{" "}
            {review.publisher.displayName}
            {" · "}
            {review.likeCount === 1 ? "1 like" : `${review.likeCount ?? 0} likes`}
          </p>
        </div>
        <span className="shrink-0 font-display text-sm text-lime sm:pl-4">Watch featured →</span>
      </Link>
    </section>
  );
}
