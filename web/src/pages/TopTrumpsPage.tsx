import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, MemberCard, TopTrumpsCategory } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

type CategoryMeta = { id: TopTrumpsCategory; label: string; direction: "higher" | "lower" };

export function TopTrumpsPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [rewards, setRewards] = useState({ win: 25, play: 5 });
  const [myCars, setMyCars] = useState<GarageCar[]>([]);
  const [memberCards, setMemberCards] = useState<MemberCard[]>([]);
  const [listingId, setListingId] = useState<number | "">("");
  const [opponentListingId, setOpponentListingId] = useState<number | "">("");
  const [category, setCategory] = useState<TopTrumpsCategory>("bhp");
  const [mode, setMode] = useState<"house" | "pvp">("house");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [cats, garage, members] = await Promise.all([
        api.fetchTopTrumpsCategories(),
        api.fetchGarage(),
        api.fetchMemberCards(),
      ]);
      setCategories(cats.categories);
      setRewards(cats.rewards);
      setMyCars(garage.cars);
      setMemberCards(members.cards);
      if (garage.cars[0]) setListingId(garage.cars[0].id);
    })().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load play data");
    });
  }, [user?.id]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
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
          `${outcome}. ${res.match.challengerValue} vs ${res.match.opponentValue} (${res.match.opponent.make} ${res.match.opponent.model}). +${res.match.coinReward} BC`,
        );
      } else {
        if (opponentListingId === "") {
          setError("Pick an opponent card");
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
        setResult(
          `${outcome}. ${res.match.challengerValue} vs ${res.match.opponentValue} (${res.match.opponent.make} ${res.match.opponent.model}). +${res.match.coinReward} BC`,
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
            Put a car up, pick a category. Higher power and top speed win; lower 0–60 wins. Playing
            earns Brad Coins (win {rewards.win}, otherwise {rewards.play}).
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
          <div className="bay-rise-delay mt-8 flex flex-col gap-4 border-y border-white/10 py-6">
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Mode
              <select
                className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                value={mode}
                onChange={(e) => setMode(e.target.value as "house" | "pvp")}
              >
                <option value="house">Vs house</option>
                <option value="pvp">Vs another member’s car</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Your card
              <select
                className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                value={listingId}
                onChange={(e) => setListingId(Number(e.target.value))}
              >
                {myCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {listingTitle(car)}
                  </option>
                ))}
              </select>
            </label>
            {mode === "pvp" ? (
              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                Opponent card
                <select
                  className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                  value={opponentListingId}
                  onChange={(e) => setOpponentListingId(Number(e.target.value))}
                >
                  <option value="">Pick one</option>
                  {memberCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.ownerDisplayName}: {card.make} {card.model}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Category
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
            <button
              type="button"
              disabled={busy}
              onClick={() => void onPlay()}
              className="bay-cta w-fit rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Playing…" : "Play"}
            </button>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {result ? <p className="mt-4 text-sm text-lime">{result}</p> : null}

        <p className="mt-10 text-sm text-steel">
          Prefer a free swap?{" "}
          <Link to="/trades" className="text-lime no-underline hover:underline">
            Trade cards
          </Link>
        </p>
      </main>
    </div>
  );
}
