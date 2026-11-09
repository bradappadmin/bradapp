import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../auth-context";
import type { ListingDetail } from "../cars";
import { formatCoins, listingTitle } from "../cars";
import {
  clearCompareSelection,
  loadCompareSelection,
  type ComparePick,
} from "../compare-selection";
import { buildCompareRows, compareTitles, type CompareHighlight } from "../compare-specs";
import { CarHeroVisual } from "../components/CarCard";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { SiteHeader } from "../components/SiteHeader";
import { compareSharePath } from "../share-link";

function cellClass(side: "left" | "right", highlight: CompareHighlight): string {
  if (highlight === side) return "font-semibold text-lime";
  if (highlight === "tie") return "text-mist";
  return "text-mist";
}

export function ComparePage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [left, setLeft] = useState<ListingDetail | null>(null);
  const [right, setRight] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<ComparePick[]>([]);

  const a = Number(params.get("a") ?? "");
  const b = Number(params.get("b") ?? "");
  const hasPair = Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0 && a !== b;

  useEffect(() => {
    setPicks(loadCompareSelection());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasPair) {
        setLeft(null);
        setRight(null);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      try {
        const [leftRes, rightRes] = await Promise.all([
          api.fetchListing(a),
          api.fetchListing(b),
        ]);
        if (!cancelled) {
          setLeft(leftRes.listing);
          setRight(rightRes.listing);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLeft(null);
          setRight(null);
          setError(err instanceof Error ? err.message : "Could not load listings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [a, b, hasPair]);

  const rows = useMemo(
    () => (left && right ? buildCompareRows(left, right) : []),
    [left, right],
  );
  const titles = left && right ? compareTitles(left, right) : null;

  function onClearTray() {
    clearCompareSelection();
    setPicks([]);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Specs face-off</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          Compare
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-steel">
          Pick two listings from{" "}
          <Link to="/cars" className="text-lime no-underline hover:underline">
            Cars
          </Link>
          {user ? (
            <>
              {" "}
              or{" "}
              <Link to="/favourites" className="text-lime no-underline hover:underline">
                Favourites
              </Link>
            </>
          ) : null}
          , then open them side by side — Brad Coin price and the key specs.
        </p>

        {!hasPair ? (
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-steel">
              {picks.length === 0
                ? "No cars selected yet."
                : picks.length === 1
                  ? "One car selected — pick a second from Cars or Favourites."
                  : "Two cars ready — open the side-by-side view from the tray on Cars or Favourites."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/cars"
                className="rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Pick from Cars
              </Link>
              {user ? (
                <Link
                  to="/favourites"
                  className="rounded-md border border-lime/40 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
                >
                  Pick from Favourites
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                >
                  Sign in for Favourites
                </Link>
              )}
              {picks.length > 0 ? (
                <button
                  type="button"
                  onClick={onClearTray}
                  className="rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist transition hover:border-rose hover:text-rose"
                >
                  Clear picks
                </button>
              ) : null}
            </div>
            {picks.length > 0 ? (
              <ul className="mt-6 list-none space-y-2 border-t border-white/10 p-0 pt-4 text-sm text-mist">
                {picks.map((pick) => (
                  <li key={pick.id}>
                    {listingTitle(pick)} · {formatCoins(pick.coinPrice)} ·{" "}
                    <Link to={`/cars/${pick.id}`} className="text-lime no-underline hover:underline">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {loading && hasPair ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-6 text-sm text-rose">{error}</p> : null}

        {left && right && titles ? (
          <div className="bay-rise mt-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Link
                  to={`/cars/${left.id}`}
                  className="font-display text-xl font-semibold text-mist no-underline hover:text-lime"
                >
                  {titles.left}
                </Link>
                <p className="mt-1 text-sm text-steel">
                  {left.year} · {formatCoins(left.coinPrice)}
                </p>
                <CarHeroVisual
                  colour={left.colour}
                  bodyType={left.bodyType}
                  make={left.make}
                  model={left.model}
                  title={titles.left}
                />
              </div>
              <div>
                <Link
                  to={`/cars/${right.id}`}
                  className="font-display text-xl font-semibold text-mist no-underline hover:text-lime"
                >
                  {titles.right}
                </Link>
                <p className="mt-1 text-sm text-steel">
                  {right.year} · {formatCoins(right.coinPrice)}
                </p>
                <CarHeroVisual
                  colour={right.colour}
                  bodyType={right.bodyType}
                  make={right.make}
                  model={right.model}
                  title={titles.right}
                />
              </div>
            </div>

            <div className="mt-8 overflow-x-auto border-t border-white/10 pt-4">
              <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                <caption className="sr-only">Side-by-side listing comparison</caption>
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-steel">
                    <th scope="col" className="py-2 pr-3 font-normal">
                      Spec
                    </th>
                    <th scope="col" className="py-2 px-2 font-normal">
                      {titles.left}
                    </th>
                    <th scope="col" className="py-2 pl-2 font-normal">
                      {titles.right}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <th scope="row" className="py-3 pr-3 font-normal text-steel">
                        {row.label}
                      </th>
                      <td className={`py-3 px-2 ${cellClass("left", row.highlight)}`}>
                        {row.left}
                      </td>
                      <td className={`py-3 pl-2 ${cellClass("right", row.highlight)}`}>
                        {row.right}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-steel">
              Lime highlights the stronger value (or lower Brad Coin price / mileage / 0–60).
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <CopyShareLinkButton
                path={compareSharePath(left.id, right.id)}
                label="Copy compare link"
                className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist transition hover:border-lime/40 hover:text-lime"
              />
              <Link
                to="/cars"
                className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Back to Cars
              </Link>
              {user ? (
                <Link
                  to="/favourites"
                  className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                >
                  Favourites
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClearTray}
                className="rounded-md border border-white/15 px-4 py-2 font-display text-sm font-semibold text-mist transition hover:border-rose hover:text-rose"
              >
                Clear picks
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
