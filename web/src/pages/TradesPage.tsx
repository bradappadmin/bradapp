import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as api from "../api";
import type { GarageCar, MemberCard, TradeRow } from "../api";
import { useAuth } from "../auth-context";
import { listingTitle } from "../cars";
import { SiteHeader } from "../components/SiteHeader";

export function TradesPage() {
  const { user, loading: authLoading } = useAuth();
  const [myCars, setMyCars] = useState<GarageCar[]>([]);
  const [memberCards, setMemberCards] = useState<MemberCard[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [offerListingId, setOfferListingId] = useState<number | "">("");
  const [requestListingId, setRequestListingId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const [garage, members, tradeList] = await Promise.all([
      api.fetchGarage(),
      api.fetchMemberCards(),
      api.fetchTrades(),
    ]);
    setMyCars(garage.cars);
    setMemberCards(members.cards);
    setTrades(tradeList.trades);
    if (garage.cars[0] && offerListingId === "") setOfferListingId(garage.cars[0].id);
  }

  useEffect(() => {
    if (!user) return;
    void reload().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load trades");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  async function onCreate() {
    if (offerListingId === "" || requestListingId === "") {
      setError("Pick both cars");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.createTrade({ offerListingId, requestListingId });
      setMessage("Trade offer sent — free swap, no Brad Coins.");
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
    try {
      await api.acceptTrade(id);
      setMessage("Trade accepted. Cars swapped.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDecline(id: number) {
    setBusy(true);
    try {
      await api.declineTrade(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decline failed");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(id: number) {
    setBusy(true);
    try {
      await api.cancelTrade(id);
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
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="bay-rise">
          <h1 className="font-display text-3xl font-semibold text-white">Card trades</h1>
          <p className="mt-2 text-sm text-steel">
            Swap cars with friends for free — no Brad Coins change hands.
          </p>
        </div>

        <div className="bay-rise-delay mt-8 flex flex-col gap-4 border-y border-white/10 py-6">
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
            You offer
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
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-steel">
            You request
            <select
              className="rounded-md border border-white/10 bg-bay-panel px-3 py-2 text-sm text-mist"
              value={requestListingId}
              onChange={(e) => setRequestListingId(Number(e.target.value))}
            >
              <option value="">Pick their car</option>
              {memberCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.ownerDisplayName}: {card.make} {card.model}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy || myCars.length === 0}
            onClick={() => void onCreate()}
            className="bay-cta w-fit rounded-md bg-rose px-5 py-3 font-display text-sm font-semibold text-white disabled:opacity-60"
          >
            Send free trade
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-rose">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-lime">{message}</p> : null}

        <section className="mt-10">
          <h2 className="font-display text-xl text-mist">Open & recent</h2>
          <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {trades.map((trade) => {
              const incoming = user && trade.toUserId === user.id && trade.status === "pending";
              const outgoing = user && trade.fromUserId === user.id && trade.status === "pending";
              return (
                <li key={trade.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="text-mist">
                      {trade.fromDisplayName} offers {trade.offerMake} {trade.offerModel} for{" "}
                      {trade.requestMake} {trade.requestModel}
                    </p>
                    <p className="text-xs text-steel">{trade.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {incoming ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onAccept(trade.id)}
                          className="rounded-md bg-lime/20 px-3 py-1.5 text-sm text-lime"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onDecline(trade.id)}
                          className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist"
                        >
                          Decline
                        </button>
                      </>
                    ) : null}
                    {outgoing ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onCancel(trade.id)}
                        className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-mist"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {trades.length === 0 ? <p className="mt-3 text-sm text-steel">No trades yet.</p> : null}
        </section>

        <p className="mt-10 text-sm text-steel">
          Or earn coins in{" "}
          <Link to="/play" className="text-lime no-underline hover:underline">
            Top Trumps
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
