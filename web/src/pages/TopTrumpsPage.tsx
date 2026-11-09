import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, MemberCard, MemberSummary, TopTrumpsCategory } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

type CategoryMeta = { id: TopTrumpsCategory; label: string; direction: "higher" | "lower" };

export function TopTrumpsPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const opponentFromUrl = Number(searchParams.get("opponent") ?? "");

  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [rewards, setRewards] = useState({ win: 25, play: 5 });
  const [myCars, setMyCars] = useState<GarageCar[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [opponentCards, setOpponentCards] = useState<MemberCard[]>([]);
  const [listingId, setListingId] = useState<number | "">("");
  const [opponentUserId, setOpponentUserId] = useState<number | "">(
    Number.isFinite(opponentFromUrl) && opponentFromUrl > 0 ? opponentFromUrl : "",
  );
  const [opponentListingId, setOpponentListingId] = useState<number | "">("");
  const [category, setCategory] = useState<TopTrumpsCategory>("bhp");
  const [mode, setMode] = useState<"house" | "challenge">(
    Number.isFinite(opponentFromUrl) && opponentFromUrl > 0 ? "challenge" : "house",
  );
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const challengeableMembers = useMemo(
    () => members.filter((m) => user && m.id !== user.id && m.carCount > 0),
    [members, user],
  );

  const selectedOpponent = useMemo(
    () =>
      opponentUserId === ""
        ? null
        : challengeableMembers.find((m) => m.id === opponentUserId) ?? null,
    [challengeableMembers, opponentUserId],
  );

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [cats, garage, memberList] = await Promise.all([
        api.fetchTopTrumpsCategories(),
        api.fetchGarage(),
        api.fetchMembers(),
      ]);
      setCategories(cats.categories);
      setRewards(cats.rewards);
      setMyCars(garage.cars);
      setMembers(memberList.members);
      if (garage.cars[0]) setListingId(garage.cars[0].id);
    })().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load play data");
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user || mode !== "challenge" || opponentUserId === "") {
      setOpponentCards([]);
      setOpponentListingId("");
      return;
    }
    let cancelled = false;
    void api
      .fetchMemberCards(opponentUserId)
      .then((res) => {
        if (cancelled) return;
        setOpponentCards(res.cards);
        setOpponentListingId(res.cards[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load opponent cards");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, mode, opponentUserId]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function onModeChange(next: "house" | "challenge") {
    setMode(next);
    setResult(null);
    setError(null);
    if (next === "house") {
      setOpponentUserId("");
      setOpponentListingId("");
      setSearchParams({}, { replace: true });
    }
  }

  function onOpponentChange(nextId: number | "") {
    setOpponentUserId(nextId);
    setOpponentListingId("");
    setResult(null);
    if (nextId === "") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ opponent: String(nextId) }, { replace: true });
    }
  }

  async function onPlay() {
    if (!user || listingId === "") return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      if (mode === "house") {
        const res = await api.playTopTrumpsHouse({ listingId, category });
        setUser({ ...user, coinBalance: res.balance });
        const w = res.match.winner;
        const outcome =
          w === "challenger" ? "You win" : w === "draw" ? "Draw" : "House wins";
        setResult(
          `${outcome}. Your ${res.match.challengerValue} vs house ${res.match.opponentValue} (${res.match.opponent.make} ${res.match.opponent.model}). +${res.match.coinReward} BC`,
        );
      } else {
        if (opponentUserId === "" || opponentListingId === "") {
          setError("Pick an opponent and one of their cars.");
          return;
        }
        const res = await api.playTopTrumpsPvp({
          listingId,
          opponentListingId,
          category,
        });
        setUser({ ...user, coinBalance: res.balance });
        const w = res.match.winner;
        const outcome =
          w === "challenger" ? "You win" : w === "draw" ? "Draw" : "They win";
        const rivalName = selectedOpponent?.displayName ?? "Opponent";
        setResult(
          `${outcome} vs ${rivalName}. ${res.match.challengerValue} vs ${res.match.opponentValue} (${res.match.opponent.make} ${res.match.opponent.model}). +${res.match.coinReward} BC`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Play failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Top Trumps</h1>
          <p className="mt-2 text-sm text-steel">
            1) Pick your car. 2) Face the house or challenge a member and pick their card. 3) Choose a
            category. Higher power and top speed win; lower 0–60 wins. Win {rewards.win} BC, or{" "}
            {rewards.play} BC for playing.
          </p>
        </div>

        {myCars.length === 0 ? (
          <p className="mt-8 text-sm text-steel">
            You need a car in{" "}
            <Link to="/cars" className="text-lime no-underline hover:underline">
              the shop
            </Link>{" "}
            before you can play.
          </p>
        ) : (
          <div className="bay-rise-delay mt-8 flex flex-col gap-5 border-y border-white/10 py-6">
            <section>
              <h2 className="font-display text-sm uppercase tracking-wide text-steel">1. Your card</h2>
              <label className="mt-2 flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                Car you put up
                <select
                  className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                  value={listingId}
                  onChange={(e) => setListingId(Number(e.target.value))}
                >
                  {myCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {listingTitle(car)} · {car.year} · {car.colour}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wide text-steel">2. Opponent</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onModeChange("house")}
                  className={`rounded-md border px-4 py-2 font-display text-sm ${
                    mode === "house"
                      ? "border-lime/50 bg-lime/10 text-lime"
                      : "border-white/15 text-mist hover:border-lime/40"
                  }`}
                >
                  Vs house
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("challenge")}
                  className={`rounded-md border px-4 py-2 font-display text-sm ${
                    mode === "challenge"
                      ? "border-lime/50 bg-lime/10 text-lime"
                      : "border-white/15 text-mist hover:border-lime/40"
                  }`}
                >
                  Challenge a member
                </button>
              </div>

              {mode === "challenge" ? (
                <div className="mt-4 flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                    Opponent
                    <select
                      className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                      value={opponentUserId}
                      onChange={(e) =>
                        onOpponentChange(e.target.value === "" ? "" : Number(e.target.value))
                      }
                    >
                      <option value="">Pick a member</option>
                      {challengeableMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName} · {member.carCount} cars · {member.coinBalance} BC
                        </option>
                      ))}
                    </select>
                  </label>
                  {challengeableMembers.length === 0 ? (
                    <p className="text-sm text-steel">
                      Nobody else has cars yet. Browse{" "}
                      <Link to="/members" className="text-lime no-underline hover:underline">
                        members
                      </Link>{" "}
                      or play the house.
                    </p>
                  ) : null}
                  {opponentUserId !== "" ? (
                    <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                      Their card
                      <select
                        className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                        value={opponentListingId}
                        onChange={(e) => setOpponentListingId(Number(e.target.value))}
                      >
                        {opponentCards.length === 0 ? <option value="">Loading…</option> : null}
                        {opponentCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.make} {card.model} · {card.bhp} bhp · 0–60 {card.zeroToSixtySecs}s
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-steel">Random house card from the catalogue.</p>
              )}
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wide text-steel">3. Category</h2>
              <label className="mt-2 flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                Stat to compare
                <select
                  className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TopTrumpsCategory)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.direction} wins)
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <button
              type="button"
              disabled={busy}
              onClick={() => void onPlay()}
              className="bay-cta w-fit rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy
                ? "Playing…"
                : mode === "challenge"
                  ? "Play challenge"
                  : "Play vs house"}
            </button>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {result ? <p className="mt-4 text-sm text-lime">{result}</p> : null}

        <p className="mt-10 text-sm text-steel">
          See who’s around on{" "}
          <Link to="/members" className="text-lime no-underline hover:underline">
            Members
          </Link>
          , or{" "}
          <Link to="/trades" className="text-lime no-underline hover:underline">
            trade cards
          </Link>{" "}
          for free.
        </p>
      </main>
    </div>
  );
}
