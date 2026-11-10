import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, MemberCard, MemberSummary, TradeRow } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { PlayBayAtmosphere } from "../components/PlayBayAtmosphere";
import { SiteHeader } from "../components/SiteHeader";
import { TradeOfferPair } from "../components/TradeOfferPair";
import { TrumpCard } from "../components/TrumpCard";
import { useToast } from "../toast-context";
import {
  garageToTrumpCard,
  memberCardToTrumpCard,
  tradeOfferCar,
  tradeRequestCar,
} from "../trade-cars";
import { openPartnerHref, openPartnerLabel } from "../trade-open-partner";

const fieldClass =
  "rounded-md border border-white/10 bg-bay-panel px-3 py-2.5 text-sm text-mist outline-none ring-lime/40 focus:ring-2";

function statusLabel(status: TradeRow["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusBadgeClass(status: TradeRow["status"]): string {
  switch (status) {
    case "pending":
      return "border-lime/30 text-lime";
    case "accepted":
      return "border-lime/40 bg-lime/10 text-lime";
    case "declined":
      return "border-rose/35 text-rose";
    case "cancelled":
      return "border-white/15 text-steel";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function TradesPage() {
  const { user, loading: authLoading, refreshTradeInbox } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const withFromUrl = Number(searchParams.get("with") ?? "");
  const theirCarFromUrl = Number(searchParams.get("theirCar") ?? "");
  const preferredRequestListingId =
    Number.isFinite(theirCarFromUrl) && theirCarFromUrl > 0 ? theirCarFromUrl : null;

  const [myCars, setMyCars] = useState<GarageCar[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [memberCards, setMemberCards] = useState<MemberCard[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [partnerUserId, setPartnerUserId] = useState<number | "">(
    Number.isFinite(withFromUrl) && withFromUrl > 0 ? withFromUrl : "",
  );
  const [offerListingId, setOfferListingId] = useState<number | "">("");
  const [requestListingId, setRequestListingId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const tradePartners = useMemo(
    () => members.filter((m) => user && m.id !== user.id && m.carCount > 0),
    [members, user],
  );

  const incoming = useMemo(
    () => trades.filter((t) => user && t.toUserId === user.id && t.status === "pending"),
    [trades, user],
  );
  const outgoing = useMemo(
    () => trades.filter((t) => user && t.fromUserId === user.id && t.status === "pending"),
    [trades, user],
  );
  const history = useMemo(
    () => trades.filter((t) => t.status === "accepted"),
    [trades],
  );

  const selectedOfferCar = useMemo(
    () => myCars.find((car) => car.id === offerListingId) ?? null,
    [myCars, offerListingId],
  );
  const selectedRequestCard = useMemo(
    () => memberCards.find((card) => card.id === requestListingId) ?? null,
    [memberCards, requestListingId],
  );

  async function reload() {
    const [garage, memberList, tradeList] = await Promise.all([
      api.fetchGarage(),
      api.fetchMembers(),
      api.fetchTrades(),
    ]);
    setMyCars(garage.cars);
    setMembers(memberList.members);
    setTrades(tradeList.trades);
    if (garage.cars[0] && offerListingId === "") setOfferListingId(garage.cars[0].id);
    await refreshTradeInbox();
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load trades");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user || partnerUserId === "") {
      setMemberCards([]);
      setRequestListingId("");
      return;
    }
    let cancelled = false;
    void api
      .fetchMemberCards(partnerUserId)
      .then((res) => {
        if (cancelled) return;
        setMemberCards(res.cards);
        const preferred =
          preferredRequestListingId != null
            ? res.cards.find((card) => card.id === preferredRequestListingId)
            : undefined;
        setRequestListingId(preferred?.id ?? res.cards[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load their cars");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, partnerUserId, preferredRequestListingId]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  function onPartnerChange(nextId: number | "") {
    setPartnerUserId(nextId);
    setRequestListingId("");
    if (nextId === "") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ with: String(nextId) }, { replace: true });
    }
  }

  function onRequestCarChange(nextId: number | "") {
    setRequestListingId(nextId);
    if (partnerUserId === "") return;
    const next = new URLSearchParams({ with: String(partnerUserId) });
    if (nextId !== "") next.set("theirCar", String(nextId));
    setSearchParams(next, { replace: true });
  }

  async function onCreate() {
    if (offerListingId === "" || requestListingId === "") {
      setError("Pick the car you offer and the car you want.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.createTrade({ offerListingId, requestListingId });
      const ok = "Free trade offer sent — no Brad Coins move. Waiting in their inbox.";
      setMessage(ok);
      toast.success(ok);
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create trade";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onAccept(id: number) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.acceptTrade(id);
      const ok = "Accepted — ownership swapped. Still zero Brad Coins spent.";
      setMessage(ok);
      toast.success(ok);
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Accept failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onDecline(id: number) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.declineTrade(id);
      const ok = "Declined.";
      setMessage(ok);
      toast.success(ok);
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Decline failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(id: number) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.cancelTrade(id);
      const ok = "Offer cancelled.";
      setMessage(ok);
      toast.success(ok);
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cancel failed";
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
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="bay-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-steel">Midnight garage</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Card trades
            </h1>
            <span className="bay-brand-line mt-4 block h-1 w-28 rounded-full sm:w-36" />
            <p className="mt-5 text-sm leading-relaxed text-steel sm:text-base">
              Offer one of your cars for one of theirs. They accept or decline. Ownership swaps — no
              Brad Coins change hands.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Trade bay notes">
              <span className="rounded-md border border-lime/30 bg-lime/10 px-3 py-1.5 font-display text-xs font-semibold text-lime">
                Free swaps
              </span>
              <span className="rounded-md border border-white/10 bg-bay-panel/60 px-3 py-1.5 font-display text-xs font-semibold text-mist">
                {incoming.length} in inbox
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              to="/trades/history"
              className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
            >
              Completed history
            </Link>
            <Link
              to="/members"
              className="rounded-md border border-white/12 px-4 py-2.5 font-display text-sm text-steel no-underline transition hover:border-lime/35 hover:text-lime"
            >
              Members
            </Link>
          </div>
        </header>

        <section className="bay-rise-delay mt-8" aria-labelledby="trades-inbox">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="trades-inbox" className="font-display text-xl text-mist">
              Inbox
            </h2>
            <p className="text-sm text-steel">
              {incoming.length} pending {incoming.length === 1 ? "offer" : "offers"} for you
            </p>
          </div>
          {loading ? <p className="text-sm text-steel">Loading…</p> : null}
          <ul className="flex flex-col gap-3">
            {incoming.map((trade) => {
              const partnerHref = openPartnerHref(trade.fromUserId, user?.id ?? null);
              return (
              <li key={trade.id} className="play-panel flex flex-col gap-4 rounded-md border p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-mist">
                    <span className="font-display text-lime">{trade.fromDisplayName}</span> wants a
                    free swap
                  </p>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(trade.status)}`}
                  >
                    {statusLabel(trade.status)} · free
                  </span>
                </div>
                <TradeOfferPair
                  offerLabel={`${trade.fromDisplayName} offers`}
                  requestLabel="You give"
                  offerCar={tradeOfferCar(trade)}
                  requestCar={tradeRequestCar(trade)}
                />
                <div className="flex flex-wrap gap-2">
                  {partnerHref ? (
                    <Link
                      to={partnerHref}
                      className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                      aria-label={`${openPartnerLabel()} ${trade.fromDisplayName}`}
                    >
                      {openPartnerLabel()}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onAccept(trade.id)}
                    className="rounded-md bg-rose px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDecline(trade.id)}
                    className="rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-rose/40 hover:text-rose disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
          {!loading && incoming.length === 0 ? (
            <div
              className="play-panel bay-rise-delay rounded-md border px-5 py-12 text-center sm:py-14"
              role="status"
              aria-label="Empty trade inbox"
            >
              <p className="font-display text-xl text-mist sm:text-2xl">Inbox is empty</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-steel">
                No pending free swaps waiting for you. Browse members with cars, or pick something
                for sale and offer a trade from their garage.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Link
                  to="/members"
                  className="bay-cta inline-flex items-center justify-center rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white no-underline transition hover:brightness-110"
                >
                  Browse members
                </Link>
                <Link
                  to="/cars"
                  className="inline-flex items-center justify-center rounded-md border border-lime/35 bg-bay-panel/70 px-5 py-3 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                >
                  Browse cars for sale
                </Link>
              </div>
              <p className="mt-4 text-xs text-steel">
                Or compose a free trade below — completed swaps stay on{" "}
                <Link to="/trades/history" className="text-lime no-underline hover:underline">
                  history
                </Link>
                .
              </p>
            </div>
          ) : null}
        </section>

        <section className="mt-8" aria-labelledby="trades-outgoing">
          <h2 id="trades-outgoing" className="mb-3 font-display text-xl text-mist">
            Your outgoing offers
          </h2>
          <ul className="flex flex-col gap-3">
            {outgoing.map((trade) => {
              const partnerHref = openPartnerHref(trade.toUserId, user?.id ?? null);
              return (
              <li key={trade.id} className="play-panel flex flex-col gap-4 rounded-md border p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-mist">
                    Waiting on <span className="font-display text-lime">{trade.toDisplayName}</span>
                  </p>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(trade.status)}`}
                  >
                    {statusLabel(trade.status)}
                  </span>
                </div>
                <TradeOfferPair
                  offerLabel="You offer"
                  requestLabel={`You want from ${trade.toDisplayName}`}
                  offerCar={tradeOfferCar(trade)}
                  requestCar={tradeRequestCar(trade)}
                />
                <div className="flex flex-wrap gap-2">
                  {partnerHref ? (
                    <Link
                      to={partnerHref}
                      className="rounded-md border border-lime/35 bg-bay-panel/70 px-4 py-2.5 font-display text-sm font-semibold text-lime no-underline transition hover:border-lime/60 hover:bg-lime/10"
                      aria-label={`${openPartnerLabel()} ${trade.toDisplayName}`}
                    >
                      {openPartnerLabel()}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onCancel(trade.id)}
                    className="w-fit rounded-md border border-white/15 px-4 py-2.5 font-display text-sm text-mist transition hover:border-rose/40 hover:text-rose disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
          {!loading && outgoing.length === 0 ? (
            <div className="play-panel rounded-md border p-4 sm:p-5">
              <p className="text-sm text-steel">No outgoing offers.</p>
            </div>
          ) : null}
        </section>

        <section
          id="compose-trade"
          className="play-panel bay-rise-delay mt-8 rounded-md border p-4 sm:p-6"
          aria-labelledby="trades-compose"
        >
          <h2 id="trades-compose" className="font-display text-xl text-mist">
            Send a free trade
          </h2>
          <p className="mt-2 text-sm text-steel">
            Pick a member, the card you want from them, and the card you offer. Deeplinks from a
            listing or garage land here with the partner and car pre-selected.
          </p>
          <div className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Member
              <select
                className={fieldClass}
                value={partnerUserId}
                onChange={(e) =>
                  onPartnerChange(e.target.value === "" ? "" : Number(e.target.value))
                }
              >
                <option value="">Pick a member</option>
                {tradePartners.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName} · {member.carCount} cars
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              You request (their car)
              <select
                className={fieldClass}
                value={requestListingId}
                onChange={(e) =>
                  onRequestCarChange(e.target.value === "" ? "" : Number(e.target.value))
                }
                disabled={partnerUserId === ""}
              >
                <option value="">
                  {partnerUserId === "" ? "Pick a member first" : "Pick their car"}
                </option>
                {memberCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.make} {card.model} · {card.year}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              You offer (your car)
              <select
                className={fieldClass}
                value={offerListingId}
                onChange={(e) => setOfferListingId(Number(e.target.value))}
              >
                <option value="">Pick your car</option>
                {myCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {listingTitle(car)}
                  </option>
                ))}
              </select>
            </label>
            {selectedOfferCar || selectedRequestCard ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedOfferCar ? (
                  <TrumpCard label="You offer" car={garageToTrumpCard(selectedOfferCar)} />
                ) : (
                  <p className="rounded-md border border-white/10 bg-bay-deep/40 px-3 py-4 text-sm text-steel">
                    Pick the car you offer.
                  </p>
                )}
                {selectedRequestCard ? (
                  <TrumpCard
                    label="You request"
                    car={memberCardToTrumpCard(selectedRequestCard)}
                  />
                ) : (
                  <p className="rounded-md border border-white/10 bg-bay-deep/40 px-3 py-4 text-sm text-steel">
                    {partnerUserId === "" ? "Pick a member first." : "Pick their car."}
                  </p>
                )}
              </div>
            ) : null}
            {myCars.length === 0 ? (
              <p className="text-sm text-steel">
                You need a car in{" "}
                <Link to="/cars" className="text-lime no-underline hover:underline">
                  Cars
                </Link>{" "}
                before you can trade.
              </p>
            ) : null}
            {tradePartners.length === 0 ? (
              <p className="text-sm text-steel">
                Nobody else has cars yet. Check{" "}
                <Link to="/members" className="text-lime no-underline hover:underline">
                  Members
                </Link>
                .
              </p>
            ) : null}
            <button
              type="button"
              disabled={busy || myCars.length === 0 || partnerUserId === ""}
              onClick={() => void onCreate()}
              className="bay-cta w-full rounded-md bg-rose px-5 py-3.5 font-display text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-fit"
            >
              {busy ? "Sending…" : "Send free trade offer"}
            </button>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

        <section className="mt-8" aria-labelledby="trades-recent">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="trades-recent" className="font-display text-xl text-mist">
              Recent completed trades
            </h2>
            <Link
              to="/trades/history"
              className="font-display text-sm text-lime no-underline transition hover:underline"
            >
              Full history →
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {history.slice(0, 5).map((trade) => (
              <li key={trade.id} className="play-panel flex flex-col gap-3 rounded-md border p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <p className="text-mist">
                    {trade.fromDisplayName} ↔ {trade.toDisplayName}
                  </p>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(trade.status)}`}
                  >
                    {statusLabel(trade.status)}
                  </span>
                </div>
                <TradeOfferPair
                  offerLabel={`${trade.fromDisplayName} gave`}
                  requestLabel={`${trade.toDisplayName} gave`}
                  offerCar={tradeOfferCar(trade)}
                  requestCar={tradeRequestCar(trade)}
                />
              </li>
            ))}
          </ul>
          {!loading && history.length === 0 ? (
            <div className="play-panel rounded-md border p-4 sm:p-5">
              <p className="text-sm text-steel">No accepted trades yet.</p>
            </div>
          ) : null}
        </section>

        <p className="mt-10 text-sm text-steel">
          Prefer to earn coins?{" "}
          <Link to="/play" className="text-lime no-underline hover:underline">
            Top Trumps
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
