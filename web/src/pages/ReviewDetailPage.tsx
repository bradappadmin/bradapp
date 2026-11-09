import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import * as api from "../api";
import type { ReviewSummary } from "../api";
import { useAuth } from "../auth-context";
import { SiteHeader } from "../components/SiteHeader";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

export function ReviewDetailPage() {
  const { id } = useParams();
  const reviewId = Number(id);
  const { user, loading: authLoading } = useAuth();
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    if (!user || !Number.isFinite(reviewId)) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.fetchReview(reviewId);
        if (!cancelled) {
          setReview(res.review);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load review");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, reviewId]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  async function onUnpublish() {
    if (!review) return;
    setBusy(true);
    try {
      await api.unpublishReview(review.id);
      const res = await api.fetchReview(review.id);
      setReview(res.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unpublish");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleLike() {
    if (!review || review.status !== "published") return;
    setLikeBusy(true);
    setError(null);
    try {
      const res = review.likedByMe
        ? await api.unlikeReview(review.id)
        : await api.likeReview(review.id);
      setReview({
        ...review,
        likedByMe: res.liked,
        likeCount: res.likeCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update like");
    } finally {
      setLikeBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/reviews" className="text-sm text-lime no-underline hover:underline">
          ← All reviews
        </Link>

        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {review ? (
          <article className="bay-rise mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-steel">
              {review.car.make} {review.car.model} · {review.status}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-white">{review.title}</h1>
            <p className="mt-2 text-sm text-steel">By {review.publisher.displayName}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {review.status === "published" ? (
                <button
                  type="button"
                  disabled={likeBusy}
                  onClick={() => void onToggleLike()}
                  className={`rounded-md border px-4 py-2 font-display text-sm font-semibold transition disabled:opacity-60 ${
                    review.likedByMe
                      ? "border-lime/50 text-lime hover:bg-lime/10"
                      : "border-white/15 text-mist hover:border-lime/40 hover:text-lime"
                  }`}
                  aria-pressed={review.likedByMe}
                >
                  {likeBusy ? "Updating…" : review.likedByMe ? "Liked" : "Like"}
                </button>
              ) : null}
              <p className="text-sm text-steel" aria-live="polite">
                {review.likeCount === 1 ? "1 like" : `${review.likeCount} likes`}
              </p>
            </div>

            <video
              className="mt-8 w-full rounded-md border border-white/10 bg-black"
              controls
              playsInline
              src={api.reviewVideoSrc(review.videoUrl)}
            />

            <section className="mt-10">
              <h2 className="font-display text-xl text-mist">Cue cards</h2>
              <ol className="mt-4 space-y-3">
                {review.cueCards.map((card, index) => (
                  <li key={card.id} className="border-l-2 border-rose/60 pl-4">
                    <p className="text-xs uppercase tracking-wide text-steel">
                      {index + 1}. {card.title}
                    </p>
                    <p className="mt-1 text-sm text-mist">{card.prompt}</p>
                  </li>
                ))}
              </ol>
            </section>

            {user && isAdmin(user.role) && review.status === "published" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onUnpublish()}
                className="mt-10 rounded-md border border-rose/50 px-4 py-2 font-display text-sm text-rose disabled:opacity-60"
              >
                {busy ? "Taking down…" : "Take down"}
              </button>
            ) : null}
          </article>
        ) : null}
      </main>
    </div>
  );
}
