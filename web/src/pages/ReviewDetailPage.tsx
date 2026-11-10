import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import * as api from "../api";
import type { ReviewSummary } from "../api";
import { useAuth } from "../auth-context";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { ReviewCarsMedia, reviewCarsCaption } from "../components/ReviewCarsMedia";
import { SiteHeader } from "../components/SiteHeader";
import { reviewSharePath } from "../share-link";

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
  const [featureBusy, setFeatureBusy] = useState(false);

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

  async function onToggleFeatured() {
    if (!review || review.status !== "published") return;
    setFeatureBusy(true);
    setError(null);
    try {
      if (review.featured) {
        const res = await api.unfeatureReview(review.id);
        setReview(res.review ?? { ...review, featured: false });
      } else {
        const res = await api.featureReview(review.id);
        setReview(res.review);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update featured pin");
    } finally {
      setFeatureBusy(false);
    }
  }

  const isDrag = review?.type === "drag_race";

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/reviews"
          className="inline-flex rounded-md border border-white/12 px-3 py-1.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
        >
          ← All reviews
        </Link>

        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {review ? (
          <article className="bay-rise mt-6">
            <header>
              <p className="text-xs uppercase tracking-[0.28em] text-steel">
                {isDrag ? "Drag race" : "Video review"} · Midnight garage
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {review.title}
              </h1>
              <span className="bay-brand-line mt-4 block h-1 w-24 rounded-full sm:w-28" />
              <p className="mt-4 text-sm text-steel">
                By {review.publisher.displayName} ·{" "}
                {reviewCarsCaption(review.type ?? "review", review.car, review.carB ?? null)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Review status">
                <span
                  className={`rounded-md border px-3 py-1.5 font-display text-xs font-semibold capitalize ${
                    review.status === "published"
                      ? "border-lime/35 bg-lime/10 text-lime"
                      : "border-white/12 bg-bay-panel/60 text-steel"
                  }`}
                >
                  {review.status}
                </span>
                <span className="rounded-md border border-white/12 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {isDrag ? "Drag race" : "Cue-card review"}
                </span>
                {review.featured ? (
                  <span className="rounded-md border border-lime/35 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                    Featured on home
                  </span>
                ) : null}
              </div>
            </header>

            <div className="mt-5 flex flex-wrap items-center gap-3" aria-label="Review actions">
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
              <CopyShareLinkButton
                path={reviewSharePath(review.id)}
                label="Copy link"
                className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist transition hover:border-lime/40 hover:text-lime"
              />
              <p className="text-sm text-steel" aria-live="polite">
                {review.likeCount === 1 ? "1 like" : `${review.likeCount} likes`}
              </p>
            </div>

            <section
              className="play-panel bay-rise-delay mt-8 rounded-md border p-3 sm:p-4"
              aria-labelledby="review-cars-heading"
            >
              <h2
                id="review-cars-heading"
                className="font-display text-sm font-semibold uppercase tracking-wide text-steel"
              >
                {isDrag ? "Lane cars" : "Bay car"}
              </h2>
              <ReviewCarsMedia
                type={review.type ?? "review"}
                car={review.car}
                carB={review.carB ?? null}
                size="card"
                className="mt-3"
              />
            </section>

            <section
              className="play-panel bay-rise-delay mt-6 overflow-hidden rounded-md border p-2 sm:p-3"
              aria-labelledby="review-player-heading"
            >
              <h2 id="review-player-heading" className="sr-only">
                Review video
              </h2>
              <video
                className="w-full rounded-md border border-white/10 bg-black"
                controls
                playsInline
                src={api.reviewVideoSrc(review.videoUrl)}
              />
            </section>

            <section
              className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-5"
              aria-labelledby="review-cues-heading"
            >
              <h2
                id="review-cues-heading"
                className="font-display text-lg font-semibold text-mist sm:text-xl"
              >
                Cue cards
              </h2>
              <ol className="mt-4 space-y-3">
                {review.cueCards.map((card, index) => (
                  <li
                    key={card.id}
                    className="rounded-md border border-white/10 bg-bay-deep/40 px-3 py-3 sm:border-l-2 sm:border-l-rose/60"
                  >
                    <p className="text-xs uppercase tracking-wide text-steel">
                      {index + 1}. {card.title}
                    </p>
                    <p className="mt-1 text-sm text-mist">{card.prompt}</p>
                  </li>
                ))}
              </ol>
            </section>

            {user && isAdmin(user.role) && review.status === "published" ? (
              <div
                className="play-panel mt-8 flex flex-wrap gap-3 rounded-md border p-4 sm:p-5"
                aria-label="Admin review controls"
              >
                <p className="w-full text-xs uppercase tracking-wide text-steel">Admin bay</p>
                <button
                  type="button"
                  disabled={featureBusy}
                  onClick={() => void onToggleFeatured()}
                  className={`rounded-md border px-4 py-2 font-display text-sm font-semibold transition disabled:opacity-60 ${
                    review.featured
                      ? "border-lime/50 text-lime hover:bg-lime/10"
                      : "border-white/15 text-mist hover:border-lime/40 hover:text-lime"
                  }`}
                  aria-pressed={review.featured}
                >
                  {featureBusy
                    ? "Updating…"
                    : review.featured
                      ? "Unpin from home"
                      : "Pin as featured on home"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onUnpublish()}
                  className="rounded-md border border-rose/50 px-4 py-2 font-display text-sm text-rose disabled:opacity-60"
                >
                  {busy ? "Taking down…" : "Take down"}
                </button>
              </div>
            ) : null}
          </article>
        ) : null}
      </main>
    </div>
  );
}
