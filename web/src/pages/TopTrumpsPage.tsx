import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type {
  GarageCar,
  MemberCard,
  MemberSummary,
  StreakMilestone,
  TopTrumpsCardVisual,
  TopTrumpsCategory,
  WeeklyCupSnapshot,
} from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { TrumpCard } from "../components/TrumpCard";
import { WeeklyCupPanel } from "../components/WeeklyCupPanel";
import { WinStreakPanel } from "../components/WinStreakPanel";
import { useToast } from "../toast-context";
import { prepareRematch, rematchPrompt } from "../top-trumps-rematch";

const fieldClass =
  "rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

type CategoryMeta = { id: TopTrumpsCategory; label: string; direction: "higher" | "lower" };

type MatchFaceOff = {
  outcome: string;
  categoryLabel: string;
  yourValue: number;
  theirValue: number;
  winner: "challenger" | "opponent" | "draw";
  yourCar: TopTrumpsCardVisual & { bhp?: number; topSpeedMph?: number; zeroToSixtySecs?: number };
  theirCar: TopTrumpsCardVisual & { bhp?: number; topSpeedMph?: number; zeroToSixtySecs?: number };
  theirLabel: string;
};

export function TopTrumpsPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const opponentFromUrl = Number(searchParams.get("opponent") ?? "");
  const theirCarFromUrl = Number(searchParams.get("theirCar") ?? "");
  const preferredOpponentListingId =
    Number.isFinite(theirCarFromUrl) && theirCarFromUrl > 0 ? theirCarFromUrl : null;

  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [rewards, setRewards] = useState({ win: 25, play: 5 });
  const [streakMilestones, setStreakMilestones] = useState<StreakMilestone[]>([
    { streak: 3, coins: 15 },
    { streak: 5, coins: 40 },
  ]);
  const [winStreak, setWinStreak] = useState(0);
  const [lastStreakBonus, setLastStreakBonus] = useState(0);
  const [weeklyCup, setWeeklyCup] = useState<WeeklyCupSnapshot | null>(null);
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
  const [faceOff, setFaceOff] = useState<MatchFaceOff | null>(null);
  const [awaitingRematchPick, setAwaitingRematchPick] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bayReady, setBayReady] = useState(false);

  const challengeableMembers = useMemo(
    () => members.filter((m) => user && m.id !== user.id && m.carCount > 0),
    [members, user],
  );

  const selectedMyCar = useMemo(
    () => myCars.find((car) => car.id === listingId) ?? null,
    [myCars, listingId],
  );

  const selectedOpponentCard = useMemo(
    () => opponentCards.find((card) => card.id === opponentListingId) ?? null,
    [opponentCards, opponentListingId],
  );

  const selectedOpponent = useMemo(
    () =>
      opponentUserId === ""
        ? null
        : challengeableMembers.find((m) => m.id === opponentUserId) ?? null,
    [challengeableMembers, opponentUserId],
  );

  const categoryMeta = useMemo(
    () => categories.find((c) => c.id === category) ?? null,
    [categories, category],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setBayReady(false);
    void (async () => {
      try {
        const [cats, garage, memberList, streak, cup] = await Promise.all([
          api.fetchTopTrumpsCategories(),
          api.fetchGarage(),
          api.fetchMembers(),
          api.fetchTopTrumpsStreak(),
          api.fetchWeeklyCup(),
        ]);
        if (cancelled) return;
        setCategories(cats.categories);
        setRewards(cats.rewards);
        if (cats.streakMilestones?.length) setStreakMilestones(cats.streakMilestones);
        setWinStreak(streak.streak);
        setWeeklyCup(cup);
        setMyCars(garage.cars);
        setMembers(memberList.members);
        if (garage.cars[0]) setListingId(garage.cars[0].id);
        setError(null);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load play data");
        }
      } finally {
        if (!cancelled) setBayReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
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
        const preferred =
          preferredOpponentListingId != null
            ? res.cards.find((card) => card.id === preferredOpponentListingId)
            : undefined;
        setOpponentListingId(preferred?.id ?? res.cards[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load opponent cards");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, mode, opponentUserId, preferredOpponentListingId]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function onModeChange(next: "house" | "challenge") {
    setMode(next);
    setFaceOff(null);
    setAwaitingRematchPick(false);
    setError(null);
    if (next === "house") {
      setOpponentUserId("");
      setOpponentListingId("");
      setSearchParams({}, { replace: true });
    } else {
      toast.success("Challenge started — pick a member and their car.");
    }
  }

  function onOpponentChange(nextId: number | "") {
    setOpponentUserId(nextId);
    setOpponentListingId("");
    setFaceOff(null);
    setAwaitingRematchPick(false);
    if (nextId === "") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ opponent: String(nextId) }, { replace: true });
    }
  }

  function onOpponentCarChange(nextId: number | "") {
    setOpponentListingId(nextId);
    setFaceOff(null);
    setAwaitingRematchPick(false);
    if (opponentUserId === "") return;
    const next = new URLSearchParams({ opponent: String(opponentUserId) });
    if (nextId !== "") next.set("theirCar", String(nextId));
    setSearchParams(next, { replace: true });
  }

  function onRematch() {
    const prep = prepareRematch({ mode, opponentUserId });
    setMode(prep.mode);
    setOpponentUserId(prep.opponentUserId);
    setListingId(prep.listingId);
    setOpponentListingId(prep.opponentListingId);
    setFaceOff(null);
    setError(null);
    setAwaitingRematchPick(true);
    if (prep.mode === "challenge" && prep.opponentUserId !== "") {
      setSearchParams({ opponent: String(prep.opponentUserId) }, { replace: true });
    }
  }

  const canPlay =
    listingId !== "" &&
    (mode === "house" || (opponentUserId !== "" && opponentListingId !== ""));

  async function onPlay() {
    if (!user || !canPlay || !selectedMyCar) return;
    const myListingId = listingId as number;
    setBusy(true);
    setError(null);
    setFaceOff(null);
    try {
      const catLabel = categoryMeta?.label ?? category;
      if (mode === "house") {
        const res = await api.playTopTrumpsHouse({ listingId: myListingId, category });
        setUser({ ...user, coinBalance: res.balance });
        setWinStreak(res.winStreak.current);
        setLastStreakBonus(res.winStreak.bonusAwarded);
        const w = res.match.winner;
        const outcome =
          w === "challenger" ? "You win" : w === "draw" ? "Draw" : "House wins";
        const streakBit =
          w === "challenger"
            ? ` · streak ${res.winStreak.current}`
            : w === "opponent"
              ? " · streak reset"
              : "";
        const bonusBit =
          res.winStreak.bonusAwarded > 0 ? ` · +${res.winStreak.bonusAwarded} streak BC` : "";
        const outcomeText = `${outcome} · +${res.match.coinReward} BC${streakBit}${bonusBit}`;
        setFaceOff({
          outcome: outcomeText,
          categoryLabel: catLabel,
          yourValue: res.match.challengerValue,
          theirValue: res.match.opponentValue,
          winner: w,
          yourCar: {
            ...res.match.challenger,
            bhp: selectedMyCar.bhp,
            topSpeedMph: selectedMyCar.topSpeedMph,
            zeroToSixtySecs: selectedMyCar.zeroToSixtySecs,
          },
          theirCar: res.match.opponent,
          theirLabel: "House",
        });
        toast.success(outcomeText);
        if (res.winStreak.bonusAwarded > 0) {
          toast.success(
            `Win streak ×${res.winStreak.current} — +${res.winStreak.bonusAwarded} Brad Coins`,
          );
        }
        setAwaitingRematchPick(false);
      } else {
        const theirListingId = opponentListingId as number;
        const res = await api.playTopTrumpsPvp({
          listingId: myListingId,
          opponentListingId: theirListingId,
          category,
        });
        setUser({ ...user, coinBalance: res.balance });
        setWinStreak(res.winStreak.current);
        setLastStreakBonus(res.winStreak.bonusAwarded);
        const w = res.match.winner;
        const rivalName = selectedOpponent?.displayName ?? "Opponent";
        const outcome =
          w === "challenger" ? "You win" : w === "draw" ? "Draw" : "They win";
        const streakBit =
          w === "challenger"
            ? ` · streak ${res.winStreak.current}`
            : w === "opponent"
              ? " · streak reset"
              : "";
        const bonusBit =
          res.winStreak.bonusAwarded > 0 ? ` · +${res.winStreak.bonusAwarded} streak BC` : "";
        const outcomeText = `${outcome} vs ${rivalName} · +${res.match.coinReward} BC${streakBit}${bonusBit}`;
        setFaceOff({
          outcome: outcomeText,
          categoryLabel: catLabel,
          yourValue: res.match.challengerValue,
          theirValue: res.match.opponentValue,
          winner: w,
          yourCar: {
            ...res.match.challenger,
            bhp: selectedMyCar.bhp,
            topSpeedMph: selectedMyCar.topSpeedMph,
            zeroToSixtySecs: selectedMyCar.zeroToSixtySecs,
          },
          theirCar: {
            ...res.match.opponent,
            bhp: selectedOpponentCard?.bhp,
            topSpeedMph: selectedOpponentCard?.topSpeedMph,
            zeroToSixtySecs: selectedOpponentCard?.zeroToSixtySecs,
          },
          theirLabel: rivalName,
        });
        toast.success(outcomeText);
        if (res.winStreak.bonusAwarded > 0) {
          toast.success(
            `Win streak ×${res.winStreak.current} — +${res.winStreak.bonusAwarded} Brad Coins`,
          );
        }
        setAwaitingRematchPick(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Play failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Top Trumps
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Pick your car, face the house or challenge a member, then choose a category. Higher
              power and top speed win; lower 0–60 wins. After a match, rematch with a new card pick.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Brad Coin rewards">
              <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                Win +{rewards.win} BC
              </span>
              <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                Play +{rewards.play} BC
              </span>
              <span className="rounded-md border border-rose/35 bg-rose/10 px-3 py-1.5 font-display text-xs font-semibold text-rose">
                Streak ×{winStreak}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/play/history"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Match history
            </Link>
            <Link
              to="/leaderboard"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Leaderboard
            </Link>
          </div>
        </header>

        {weeklyCup ? (
          <div className="bay-rise-delay mt-8">
            <WeeklyCupPanel cup={weeklyCup} compact viewerId={user?.id} />
          </div>
        ) : null}

        {!bayReady ? <p className="mt-8 text-steel">Loading…</p> : null}

        {bayReady && myCars.length > 0 ? (
          <div className="bay-rise-delay mt-8">
            <WinStreakPanel
              streak={winStreak}
              milestones={streakMilestones}
              lastBonus={lastStreakBonus}
            />
          </div>
        ) : null}

        {bayReady && myCars.length === 0 ? (
          <div
            className="play-panel bay-rise-delay mt-10 rounded-md border px-5 py-12 text-center sm:py-14"
            role="status"
            aria-label="Empty play bay"
          >
            <p className="font-display text-xl text-mist sm:text-2xl">Empty bay</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
              Top Trumps needs a car in your garage. Browse the catalogue for Brad Coins, check My
              cars, or see who’s around on Members.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/cars"
                className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
              >
                Browse cars
              </Link>
              <Link
                to="/garage"
                className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
              >
                My garage
              </Link>
              <Link
                to="/members"
                className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 font-display text-sm font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
              >
                Members
              </Link>
            </div>
          </div>
        ) : null}

        {bayReady && myCars.length > 0 ? (
          <div className="bay-rise-delay mt-8 flex flex-col gap-5">
            <section className="play-panel rounded-md border p-4 sm:p-5" aria-labelledby="play-your-card">
              <h2
                id="play-your-card"
                className="font-display text-sm uppercase tracking-[0.18em] text-steel"
              >
                1. Your card
              </h2>
              <label className="mt-3 flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                Car you put up
                <select
                  className={fieldClass}
                  value={listingId}
                  onChange={(e) =>
                    setListingId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  {awaitingRematchPick || listingId === "" ? (
                    <option value="">Pick a new card…</option>
                  ) : null}
                  {myCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {listingTitle(car)} · {car.year} · {car.colour}
                    </option>
                  ))}
                </select>
              </label>
              {selectedMyCar ? (
                <div className="mt-4 max-w-sm">
                  <TrumpCard label="You" car={selectedMyCar} />
                </div>
              ) : null}
            </section>

            <section className="play-panel rounded-md border p-4 sm:p-5" aria-labelledby="play-opponent">
              <h2
                id="play-opponent"
                className="font-display text-sm uppercase tracking-[0.18em] text-steel"
              >
                2. Opponent
              </h2>
              <p className="mt-2 text-sm text-steel">
                House deals a random catalogue card. Challenge picks a member and their car.
              </p>
              <div
                className="mt-4 grid gap-2 sm:grid-cols-2"
                role="group"
                aria-label="Opponent mode"
              >
                <button
                  type="button"
                  onClick={() => onModeChange("house")}
                  aria-pressed={mode === "house"}
                  className={`rounded-md border px-4 py-3 text-left transition ${
                    mode === "house"
                      ? "play-mode-active-house"
                      : "border-white/12 text-mist hover:border-lime/35"
                  }`}
                >
                  <span className="block font-display text-sm font-semibold">Vs house</span>
                  <span className="mt-1 block text-xs text-steel">
                    Random house card · studio reveal after play
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("challenge")}
                  aria-pressed={mode === "challenge"}
                  className={`rounded-md border px-4 py-3 text-left transition ${
                    mode === "challenge"
                      ? "play-mode-active-challenge"
                      : "border-white/12 text-mist hover:border-rose/40"
                  }`}
                >
                  <span className="block font-display text-sm font-semibold">Challenge a member</span>
                  <span className="mt-1 block text-xs text-steel">
                    Pick who you face and which of their cars
                  </span>
                </button>
              </div>

              {mode === "challenge" ? (
                <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5">
                  <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                    Opponent
                    <select
                      className={fieldClass}
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
                        className={fieldClass}
                        value={opponentListingId}
                        onChange={(e) =>
                          onOpponentCarChange(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                      >
                        {opponentCards.length === 0 ? (
                          <option value="">Loading…</option>
                        ) : awaitingRematchPick || opponentListingId === "" ? (
                          <option value="">Pick a new card…</option>
                        ) : null}
                        {opponentCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.make} {card.model} · {card.colour} · {card.bhp} bhp
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {selectedOpponentCard ? (
                    <div className="mt-2 max-w-sm">
                      <TrumpCard
                        label={selectedOpponent?.displayName ?? "Opponent"}
                        car={selectedOpponentCard}
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 rounded-md border border-lime/20 bg-lime/5 px-3 py-2.5 text-sm text-steel">
                  House mode active — a random catalogue card is dealt when you play.
                </p>
              )}
            </section>

            <section className="play-panel rounded-md border p-4 sm:p-5" aria-labelledby="play-category">
              <h2
                id="play-category"
                className="font-display text-sm uppercase tracking-[0.18em] text-steel"
              >
                3. Category
              </h2>
              <label className="mt-3 flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
                Stat to compare
                <select
                  className={fieldClass}
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

            {awaitingRematchPick ? (
              <p className="text-sm text-lime">{rematchPrompt(mode, selectedOpponent?.displayName ?? null)}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy || !canPlay}
                onClick={() => void onPlay()}
                className="bay-cta w-full rounded-md bg-rose px-5 py-3.5 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-fit"
              >
                {busy
                  ? "Playing…"
                  : awaitingRematchPick
                    ? mode === "challenge"
                      ? "Play rematch"
                      : "Play rematch vs house"
                    : mode === "challenge"
                      ? "Play challenge"
                      : "Play vs house"}
              </button>
              <Link
                to="/play/history"
                className="font-display text-sm text-steel no-underline transition hover:text-lime"
              >
                View match history →
              </Link>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}

        {faceOff ? (
          <section
            className="play-panel play-result-glow bay-rise relative mt-8 overflow-hidden rounded-md border p-4 sm:p-6"
            aria-label="Match result"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Face-off</p>
            <p className="mt-2 font-display text-xl font-semibold text-lime sm:text-2xl">
              {faceOff.outcome}
            </p>
            <p className="mt-1 text-sm text-steel">
              {faceOff.categoryLabel}: {faceOff.yourValue} vs {faceOff.theirValue}
            </p>
            <p className="mt-2 text-sm text-mist">
              Current win streak:{" "}
              <span className="font-display font-semibold text-rose">×{winStreak}</span>
              {lastStreakBonus > 0 ? (
                <span className="text-lime"> · streak bonus +{lastStreakBonus} BC</span>
              ) : null}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TrumpCard
                label="You"
                car={faceOff.yourCar}
                highlighted={faceOff.winner === "challenger"}
                statLabel={faceOff.categoryLabel}
                statValue={faceOff.yourValue}
              />
              <TrumpCard
                label={faceOff.theirLabel}
                car={faceOff.theirCar}
                highlighted={faceOff.winner === "opponent"}
                statLabel={faceOff.categoryLabel}
                statValue={faceOff.theirValue}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRematch}
                className="rounded-md border border-lime/40 px-4 py-2.5 font-display text-sm font-semibold text-lime transition hover:bg-lime/10"
              >
                Rematch — new card pick
              </button>
              <Link
                to="/play/history"
                className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
              >
                Match history
              </Link>
            </div>
          </section>
        ) : null}

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
