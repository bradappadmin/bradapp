import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import * as api from "../api";
import type { MemberProfileCar, MemberSummary, ShowcaseSource } from "../api";
import { useAuth } from "../auth-context";
import { formatCoins, listingTitle } from "../cars";
import { badgeForStatus } from "../car-visuals";
import { CarCard, CarHeroVisual } from "../components/CarCard";
import { CopyShareLinkButton } from "../components/CopyShareLinkButton";
import { MemberGarageBayValueStrip } from "../components/MemberGarageBayValueStrip";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { garageTradeOfferAction, garageTradeOfferHref } from "../garage-trade-offer";
import { memberProfileSharePath } from "../share-link";
import { useToast } from "../toast-context";

const GIFT_AMOUNT_PRESETS = [10, 25, 50] as const;

function showcaseHint(source: ShowcaseSource | null): string {
  switch (source) {
    case "pinned":
      return "Pinned showcase";
    case "highest_value":
      return "Highest-value car in the bay";
    case null:
      return "Showcase";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

export function MemberProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const memberId = Number(id);
  const { user, setUser, loading: authLoading } = useAuth();
  const toast = useToast();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [cars, setCars] = useState<MemberProfileCar[]>([]);
  const [showcase, setShowcase] = useState<MemberProfileCar | null>(null);
  const [showcaseSource, setShowcaseSource] = useState<ShowcaseSource | null>(null);
  const [showcaseListingId, setShowcaseListingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [gifting, setGifting] = useState(false);

  async function reload(idToLoad: number) {
    const res = await api.fetchMemberProfile(idToLoad);
    setMember(res.member);
    setCars(res.cars);
    setShowcase(res.showcase ?? null);
    setShowcaseSource(res.showcaseSource ?? null);
    setShowcaseListingId(
      typeof res.showcaseListingId === "number" ? res.showcaseListingId : null,
    );
  }

  useEffect(() => {
    if (!Number.isFinite(memberId) || memberId <= 0) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload(memberId);
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load garage");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  // Deep-link from Members directory Gift Brad Coins → #gift-coins after profile loads.
  useEffect(() => {
    if (loading || authLoading) return;
    if (location.hash !== "#gift-coins") return;
    if (!user || !member || member.id === user.id) return;
    const el = document.getElementById("gift-coins");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, authLoading, location.hash, member, user]);

  if (!Number.isFinite(memberId) || memberId <= 0) {
    return <Navigate to="/members" replace />;
  }

  const isSelf = Boolean(user && member && member.id === user.id);
  const canChallengeOrTrade = Boolean(user && member && !isSelf && member.carCount > 0);
  const canGift = Boolean(user && member && !isSelf);

  async function onGiftSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !member || !canGift) return;
    const amount = Number(giftAmount);
    if (!Number.isFinite(amount) || amount < 1 || !Number.isInteger(amount)) {
      toast.error("Enter a whole number of Brad Coins to gift.");
      return;
    }
    if (amount > user.coinBalance) {
      toast.error("Not enough Brad Coins to send this gift.");
      return;
    }
    setGifting(true);
    setError(null);
    try {
      const note = giftNote.trim();
      const res = await api.giftBradCoins(member.id, {
        amount,
        ...(note ? { note } : {}),
      });
      setUser({ ...user, coinBalance: res.senderBalance });
      setMember({ ...member, coinBalance: res.receiverBalance });
      setGiftAmount("");
      setGiftNote("");
      toast.success(
        `Sent ${formatCoins(amount)} to ${member.displayName}. Play money only.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send gift";
      setError(msg);
      toast.error(msg);
    } finally {
      setGifting(false);
    }
  }

  async function onToggleShowcase(car: MemberProfileCar) {
    if (!isSelf) return;
    const pinning = showcaseListingId !== car.id;
    setBusyId(car.id);
    setError(null);
    try {
      await api.setGarageShowcase(pinning ? car.id : null);
      await reload(memberId);
      toast.success(
        pinning
          ? "Showcase pinned — this car is your garage hero."
          : "Showcase unpinned — highest-value car takes the hero.",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update showcase";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <PlayBayAtmosphere />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-sm text-steel">
          <Link to="/members" className="text-lime no-underline hover:underline">
            ← Members
          </Link>
        </p>

        {loading || authLoading ? <p className="mt-8 text-steel">Loading…</p> : null}
        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}

        {member ? (
          <header className="bay-rise mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {member.displayName}
                {isSelf ? " (you)" : ""}
              </h1>
              <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
              <p className="mt-3 text-sm text-steel">{member.roleLabel}</p>
              {member.bio ? (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-mist">{member.bio}</p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Garage bay notes">
                <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                  {formatCoins(member.coinBalance)}
                </span>
                <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                  {member.carCount} {member.carCount === 1 ? "car" : "cars"}
                </span>
                {cars.length > 0 ? (
                  <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                    Top Trumps peek
                  </span>
                ) : null}
                {showcase ? (
                  <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                    {showcaseHint(showcaseSource)}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-steel">
                Public bay — a bay strip shows car count and total Brad Coin value when the garage
                isn’t empty, then a studio hero for the showcase car and photo-first garage cards
                with a compact Top Trumps peek under each studio photo (Power / 0–60 / Top speed),
                same as Cars and Favourites. No account secrets.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {canChallengeOrTrade ? (
                <>
                  <Link
                    to={`/play?opponent=${member.id}`}
                    className="rounded-md bg-rose px-4 py-2.5 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
                  >
                    Challenge
                  </Link>
                  <Link
                    to={`/trades?with=${member.id}`}
                    className="rounded-md border border-lime/40 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:bg-lime/10"
                  >
                    Offer trade
                  </Link>
                </>
              ) : null}
              <CopyShareLinkButton
                path={memberProfileSharePath(member.id)}
                label="Copy link"
                className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime transition hover:border-lime/60 hover:bg-lime/10"
              />
              {isSelf ? (
                <>
                  <Link
                    to="/garage"
                    className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
                  >
                    My cars
                  </Link>
                  <Link
                    to="/account"
                    className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
                  >
                    Account
                  </Link>
                </>
              ) : null}
            </div>
          </header>
        ) : null}

        {!user && !authLoading && member && !isSelf ? (
          <p className="mt-6 text-sm text-steel">
            <Link to="/signin" className="text-lime no-underline hover:underline">
              Sign in
            </Link>{" "}
            to challenge, offer a free trade, or gift Brad Coins.
          </p>
        ) : null}

        {!loading && cars.length > 0 ? <MemberGarageBayValueStrip cars={cars} /> : null}

        {canGift && member && user ? (
          <section
            id="gift-coins"
            className="play-panel bay-rise-delay mt-8 rounded-md border px-4 py-5 sm:px-5"
            aria-labelledby="gift-coins-heading"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-steel">Brad Coins</p>
            <h2 id="gift-coins-heading" className="mt-1 font-display text-xl text-mist">
              Gift coins to {member.displayName}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-steel">
              Send play-money Brad Coins from your wallet ({formatCoins(user.coinBalance)}). No real
              money.
            </p>
            <form
              className="mt-4 flex max-w-xl flex-col gap-3"
              onSubmit={(e) => void onGiftSubmit(e)}
            >
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-steel">Quick amount</p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Gift amount presets"
                >
                  {GIFT_AMOUNT_PRESETS.map((amount) => {
                    const active = giftAmount === String(amount);
                    return (
                      <button
                        key={amount}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setGiftAmount(String(amount))}
                        className={`rounded-md border px-3 py-1.5 font-display text-sm transition ${
                          active
                            ? "border-lime/50 bg-lime/10 text-lime"
                            : "border-white/15 text-mist hover:border-lime/35 hover:text-lime"
                        }`}
                      >
                        {amount} BC
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="flex min-w-[8rem] flex-1 flex-col gap-1.5 text-sm text-steel">
                  Amount
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    name="giftAmount"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(e.target.value)}
                    placeholder="25"
                    required
                    className="rounded-md border border-white/15 bg-bay-void/80 px-3 py-2 font-display text-mist outline-none focus:border-lime/50"
                  />
                </label>
                <label className="flex min-w-[12rem] flex-[2] flex-col gap-1.5 text-sm text-steel">
                  Note (optional)
                  <input
                    type="text"
                    name="giftNote"
                    maxLength={200}
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="Thanks for the bay tip"
                    className="rounded-md border border-white/15 bg-bay-void/80 px-3 py-2 text-mist outline-none focus:border-lime/50"
                  />
                </label>
                <button
                  type="submit"
                  disabled={gifting}
                  className="rounded-md bg-lime px-4 py-2.5 font-display text-sm font-semibold text-bay-void transition hover:brightness-110 disabled:opacity-60"
                >
                  {gifting ? "Sending…" : "Send gift"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {showcase ? (
          <section
            className="play-panel bay-rise-delay mt-8 overflow-hidden rounded-md border"
            aria-labelledby="showcase-heading"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-steel">Showcase</p>
                <h2 id="showcase-heading" className="mt-1 font-display text-xl text-mist sm:text-2xl">
                  {listingTitle(showcase)}
                </h2>
              </div>
              <p className="text-sm text-steel">{showcaseHint(showcaseSource)}</p>
            </div>
            <Link to={`/cars/${showcase.id}`} className="group block no-underline">
              <CarHeroVisual
                colour={showcase.colour}
                bodyType={showcase.bodyType}
                make={showcase.make}
                model={showcase.model}
                year={showcase.year}
                title={listingTitle(showcase)}
                className="min-h-[14rem] w-full sm:min-h-[20rem]"
              />
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <p className="font-display text-lg text-lime">{formatCoins(showcase.coinPrice)}</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/cars/${showcase.id}`}
                  className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                >
                  Open listing
                </Link>
                {isSelf ? (
                  <button
                    type="button"
                    disabled={busyId === showcase.id}
                    onClick={() => void onToggleShowcase(showcase)}
                    className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-sm font-semibold text-lime transition hover:bg-lime/10 disabled:opacity-60"
                  >
                    {showcaseListingId === showcase.id ? "Unpin showcase" : "Make showcase"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bay-rise-delay mt-10" aria-label="Member garage cars">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl text-mist">Garage</h2>
            <p className="text-sm text-steel">
              {cars.length} {cars.length === 1 ? "car" : "cars"}
            </p>
          </div>
          {cars.length === 0 && !loading ? (
            <div className="play-panel rounded-md border px-4 py-5 text-sm text-steel">
              Empty garage.
            </div>
          ) : null}
          {cars.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cars.map((car) => {
                const tradeAction = member
                  ? garageTradeOfferAction({
                      ownerUserId: member.id,
                      viewerId: user?.id,
                    })
                  : "hidden";
                const isShowcaseCard = showcaseListingId === car.id;
                return (
                  <li key={car.id} className="bay-rise">
                    <CarCard
                      car={car}
                      to={`/cars/${car.id}`}
                      badge={badgeForStatus(car.status, "price")}
                      layout="media"
                      footer={
                        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                          {isSelf ? (
                            <button
                              type="button"
                              disabled={busyId === car.id}
                              onClick={() => void onToggleShowcase(car)}
                              className={
                                isShowcaseCard
                                  ? "rounded-md border border-lime/40 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime transition hover:bg-lime/15 disabled:opacity-60"
                                  : "rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist transition hover:border-lime/40 hover:text-lime disabled:opacity-60"
                              }
                            >
                              {isShowcaseCard ? "Unpin showcase" : "Make showcase"}
                            </button>
                          ) : null}
                          {tradeAction === "offer" && member ? (
                            <Link
                              to={garageTradeOfferHref(member.id, car.id)}
                              className="rounded-md border border-lime/40 px-3 py-1.5 font-display text-xs font-semibold text-lime no-underline transition hover:bg-lime/10"
                            >
                              Offer trade
                            </Link>
                          ) : null}
                          {tradeAction === "signin" ? (
                            <Link
                              to="/signin"
                              className="rounded-md border border-white/15 px-3 py-1.5 font-display text-xs font-semibold text-mist no-underline transition hover:border-lime/40 hover:text-lime"
                            >
                              Sign in to offer trade
                            </Link>
                          ) : null}
                        </div>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </main>
    </div>
  );
}
