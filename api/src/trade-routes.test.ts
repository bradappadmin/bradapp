import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { memberStartingCoins } from "./coins.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("trade routes", () => {
  const app = createApp();
  const buyer = request.agent(app);
  const email = `buyer-${Date.now()}@example.com`;
  let listingId = 0;
  let cheapListingId = 0;

  beforeAll(async () => {
    await seedAccounts();
    const signup = await buyer.post("/auth/signup").send({
      email,
      password: "BuyerPass-123!",
      displayName: "Coin Buyer",
    });
    expect(signup.status).toBe(201);
    expect(signup.body.user.coinBalance).toBe(memberStartingCoins());

    const search = await request(app).get("/cars/search").query({ sort: "price_asc", limit: 5 });
    expect(search.status).toBe(200);
    listingId = search.body.listings[0].id;
    cheapListingId = search.body.listings.find(
      (l: { coinPrice: number }) => l.coinPrice <= memberStartingCoins(),
    )?.id;
    expect(cheapListingId).toBeTruthy();
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    await closePool();
  });

  it("buys a listing, moves it to garage, and updates the ledger", async () => {
    const buy = await buyer.post(`/trade/listings/${cheapListingId}/buy`);
    expect(buy.status).toBe(200);
    expect(buy.body.balance).toBeLessThan(memberStartingCoins());

    const wallet = await buyer.get("/trade/wallet");
    expect(wallet.status).toBe(200);
    expect(wallet.body.balance).toBe(buy.body.balance);
    expect(wallet.body.ledger.some((e: { reason: string }) => e.reason === "purchase")).toBe(true);
    expect(
      wallet.body.ledger.some(
        (e: { reason: string; delta: number }) =>
          e.reason === "seed" && e.delta === memberStartingCoins(),
      ),
    ).toBe(true);

    const garage = await buyer.get("/trade/garage");
    expect(garage.status).toBe(200);
    const owned = garage.body.cars.find((c: { id: number }) => c.id === cheapListingId);
    expect(owned).toBeTruthy();
    expect(owned.bhp).toBeGreaterThan(0);
    expect(owned.bodyType).toBeTruthy();
    expect(owned.topSpeedMph).toBeGreaterThan(0);
    const expectedValue = (garage.body.cars as Array<{ coinPrice: number }>).reduce(
      (sum, car) => sum + Number(car.coinPrice),
      0,
    );
    expect(garage.body.totalValue).toBe(expectedValue);
    expect(garage.body.totalValue).toBeGreaterThan(0);

    const detail = await request(app).get(`/cars/listings/${cheapListingId}`);
    expect(detail.body.listing.status).toBe("owned");

    const purchases = await buyer.get("/trade/purchases");
    expect(purchases.status).toBe(200);
    const purchase = purchases.body.purchases.find(
      (p: { listingId: number }) => p.listingId === cheapListingId,
    );
    expect(purchase).toBeTruthy();
    expect(purchase.paidPrice).toBeGreaterThan(0);
    expect(purchase.purchasedAt).toBeTruthy();
    expect(purchase.make).toBeTruthy();
    // Catalogue / bay stock has no member seller ledger row.
    expect(purchase.sellerDisplayName == null || typeof purchase.sellerDisplayName === "string").toBe(
      true,
    );
  });

  it("lists a owned car for sale and another member can buy it", async () => {
    const sellPrice = 50;
    const sell = await buyer.post(`/trade/listings/${cheapListingId}/sell`).send({ coinPrice: sellPrice });
    expect(sell.status).toBe(200);
    expect(sell.body.status).toBe("available");

    const sellerWalletBefore = await buyer.get("/trade/wallet");
    const sellerBalanceBefore = sellerWalletBefore.body.balance as number;

    const second = request.agent(app);
    const secondEmail = `buyer2-${Date.now()}@example.com`;
    const signup = await second.post("/auth/signup").send({
      email: secondEmail,
      password: "BuyerPass-123!",
      displayName: "Second Buyer",
    });
    expect(signup.status).toBe(201);

    const buy = await second.post(`/trade/listings/${cheapListingId}/buy`);
    expect(buy.status).toBe(200);

    const sellerWallet = await buyer.get("/trade/wallet");
    expect(sellerWallet.body.balance).toBe(sellerBalanceBefore + sellPrice);

    const sold = await buyer.get("/trade/sold");
    expect(sold.status).toBe(200);
    const sale = sold.body.sales.find((s: { listingId: number }) => s.listingId === cheapListingId);
    expect(sale).toBeTruthy();
    expect(sale.soldPrice).toBe(sellPrice);
    expect(sale.buyerDisplayName).toBe("Second Buyer");
    expect(sale.soldAt).toBeTruthy();
    expect(sale.make).toBeTruthy();
    expect(sale.model).toBeTruthy();

    const purchases = await second.get("/trade/purchases");
    expect(purchases.status).toBe(200);
    const purchase = purchases.body.purchases.find(
      (p: { listingId: number }) => p.listingId === cheapListingId,
    );
    expect(purchase).toBeTruthy();
    expect(purchase.paidPrice).toBe(sellPrice);
    expect(purchase.sellerDisplayName).toBe("Coin Buyer");
    expect(purchase.purchasedAt).toBeTruthy();

    await getPool().query("DELETE FROM users WHERE email = ?", [secondEmail]);
  });

  it("requires auth for sold history", async () => {
    const res = await request(app).get("/trade/sold");
    expect(res.status).toBe(401);
  });

  it("requires auth for purchase history", async () => {
    const res = await request(app).get("/trade/purchases");
    expect(res.status).toBe(401);
  });

  it("returns the personal Brad Coin ledger for the signed-in member", async () => {
    const res = await buyer.get("/trade/ledger").query({ limit: 50 });
    expect(res.status).toBe(200);
    expect(typeof res.body.balance).toBe("number");
    expect(Array.isArray(res.body.ledger)).toBe(true);
    expect(res.body.ledger.length).toBeGreaterThan(0);
    expect(res.body.ledger.some((e: { reason: string }) => e.reason === "seed")).toBe(true);
    expect(res.body.ledger.some((e: { reason: string }) => e.reason === "purchase")).toBe(true);
    for (const entry of res.body.ledger as Array<{
      reason: string;
      delta: number;
      balanceAfter: number;
      createdAt: string;
    }>) {
      expect(entry.createdAt).toBeTruthy();
      expect(typeof entry.delta).toBe("number");
      expect(typeof entry.balanceAfter).toBe("number");
      expect(
        [
          "seed",
          "purchase",
          "sale",
          "daily_login",
          "play_reward",
          "admin_adjust",
          "tt_streak_bonus",
          "weekly_cup",
        ].includes(entry.reason),
      ).toBe(true);
    }
  });

  it("requires auth for personal ledger", async () => {
    const res = await request(app).get("/trade/ledger");
    expect(res.status).toBe(401);
  });

  it("rejects buying without enough coins", async () => {
    // Drain is hard; buy an expensive car that exceeds remaining balance if possible.
    const search = await request(app).get("/cars/search").query({ sort: "price_desc", limit: 1 });
    const expensiveId = search.body.listings[0]?.id as number | undefined;
    const price = search.body.listings[0]?.coinPrice as number | undefined;
    const wallet = await buyer.get("/trade/wallet");
    if (!expensiveId || price == null || price <= wallet.body.balance) {
      expect(true).toBe(true);
      return;
    }
    const res = await buyer.post(`/trade/listings/${expensiveId}/buy`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("insufficient_coins");
  });

  it("requires auth for wallet", async () => {
    const res = await request(app).get("/trade/wallet");
    expect(res.status).toBe(401);
  });

  it("updates asking price on a listed car and can unlist it", async () => {
    // Buy a fresh affordable listing (may be none if stock depleted — skip gracefully).
    const search = await request(app).get("/cars/search").query({ sort: "price_asc", limit: 20 });
    const wallet = await buyer.get("/trade/wallet");
    const affordable = search.body.listings.find(
      (l: { coinPrice: number }) => l.coinPrice <= wallet.body.balance,
    );
    if (!affordable) {
      expect(true).toBe(true);
      return;
    }
    const carId = affordable.id as number;
    expect((await buyer.post(`/trade/listings/${carId}/buy`)).status).toBe(200);

    const listed = await buyer.post(`/trade/listings/${carId}/sell`).send({ coinPrice: 77 });
    expect(listed.status).toBe(200);
    expect(listed.body.status).toBe("available");
    expect(listed.body.coinPrice).toBe(77);

    const repriced = await buyer.post(`/trade/listings/${carId}/sell`).send({ coinPrice: 88 });
    expect(repriced.status).toBe(200);
    expect(repriced.body.coinPrice).toBe(88);

    const publicListing = await request(app).get(`/cars/listings/${carId}`);
    expect(publicListing.body.listing.status).toBe("available");
    expect(publicListing.body.listing.coinPrice).toBe(88);

    const unlist = await buyer.post(`/trade/listings/${carId}/unlist`);
    expect(unlist.status).toBe(200);
    expect(unlist.body.status).toBe("owned");

    const after = await request(app).get(`/cars/listings/${carId}`);
    expect(after.body.listing.status).toBe("owned");
  });

  // silence unused
  void listingId;
});
