import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, MemberCard, MemberSummary, TradeRow } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { SiteHeader } from "../components/SiteHeader";
import { TradeOfferPair } from "../components/TradeOfferPair";
import { TrumpCard } from "../components/TrumpCard";
import {
  garageToTrumpCard,
  memberCardToTrumpCard,
  tradeOfferCar,
  tradeRequestCar,
} from "../trade-cars";

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

export function TradesPage() {
  const { user, loading: authLoading, refreshTradeInbox } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const withFromUrl = Number(searchParams.get("with") ?? "");

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
        setRequestListingId(res.cards[0]?.id ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load their cars");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, partnerUserId]);

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
      setMessage("Free trade offer sent — no Brad Coins move. Waiting in their inbox.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create trade");
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
      setMessage("Accepted — ownership swapped. Still zero Brad Coins spent.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
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
      setMessage("Declined.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decline failed");
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
      setMessage("Offer cancelled.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Card trades</h1>
          <p className="mt-2 text-sm text-steel">
            Offer one of your cars for one of theirs. They accept or decline. Ownership swaps — no Brad
            Coins change hands.
          </p>
          <p className="mt-4">
            <Link
              to="/trades/history"
              className="font-display text-sm text-lime no-underline hover:underline"
            >
              Completed trade history
            </Link>
          </p>
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl text-mist">Inbox</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-steel">
              <span>
                {incoming.length} pending{" "}
                {incoming.length === 1 ? "offer" : "offers"} for you
              </span>
              <Link to="/trades/history" className="text-lime no-underline hover:underline">
                History
              </Link>
            </div>
          </div>
          {loading ? <p className="mt-3 text-sm text-steel">Loading…</p> : null}
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {incoming.map((trade) => (
              <li key={trade.id} className="flex flex-col gap-4 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-mist">
                    <span className="font-display text-lime">{trade.fromDisplayName}</span> wants a
                    free swap
                  </p>
                  <p className="text-xs uppercase tracking-wide text-steel">
                    {statusLabel(trade.status)} · free swap
                  </p>
                </div>
                <TradeOfferPair
                  offerLabel={`${trade.fromDisplayName} offers`}
                  requestLabel="You give"
                  offerCar={tradeOfferCar(trade)}
                  requestCar={tradeRequestCar(trade)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onAccept(trade.id)}
                    className="rounded-md bg-rose px-4 py-2 font-display text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDecline(trade.id)}
                    className="rounded-md border border-white/15 px-4 py-2 font-display text-sm text-mist disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {!loading && incoming.length === 0 ? (
            <p className="mt-3 text-sm text-steel">No pending offers in your inbox.</p>
          ) : null}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl text-mist">Your outgoing offers</h2>
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {outgoing.map((trade) => (
              <li key={trade.id} className="flex flex-col gap-4 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-mist">
                    Waiting on <span className="font-display text-lime">{trade.toDisplayName}</span>
                  </p>
                  <p className="text-xs uppercase tracking-wide text-steel">
                    {statusLabel(trade.status)}
                  </p>
                </div>
                <TradeOfferPair
                  offerLabel="You offer"
                  requestLabel={`You want from ${trade.toDisplayName}`}
                  offerCar={tradeOfferCar(trade)}
                  requestCar={tradeRequestCar(trade)}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onCancel(trade.id)}
                  className="w-fit rounded-md border border-white/15 px-4 py-2 font-display text-sm text-mist disabled:opacity-60"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
          {!loading && outgoing.length === 0 ? (
            <p className="mt-3 text-sm text-steel">No outgoing offers.</p>
          ) : null}
        </section>

        <section className="bay-rise-delay mt-10 border-y border-white/10 py-6">
          <h2 className="font-display text-xl text-mist">Send a free trade</h2>
          <p className="mt-2 text-sm text-steel">
            Pick a member, the card you want from them, and the card you offer.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
              Member
              <select
                className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
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
                className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
                value={requestListingId}
                onChange={(e) => setRequestListingId(Number(e.target.value))}
                disabled={partnerUserId === ""}
              >
                <option value="">{partnerUserId === "" ? "Pick a member first" : "Pick their car"}</option>
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
                className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
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
                  <p className="text-sm text-steel">Pick the car you offer.</p>
                )}
                {selectedRequestCard ? (
                  <TrumpCard
                    label="You request"
                    car={memberCardToTrumpCard(selectedRequestCard)}
                  />
                ) : (
                  <p className="text-sm text-steel">
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
              className="bay-cta w-fit rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send free trade offer"}
            </button>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl text-mist">Recent completed trades</h2>
            <Link
              to="/trades/history"
              className="font-display text-sm text-lime no-underline hover:underline"
            >
              Full history
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {history.slice(0, 5).map((trade) => (
              <li key={trade.id} className="flex flex-col gap-3 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <p className="text-mist">
                    {trade.fromDisplayName} ↔ {trade.toDisplayName}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-steel">
                    {statusLabel(trade.status)}
                  </p>
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
            <p className="mt-3 text-sm text-steel">No accepted trades yet.</p>
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
