import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { closePool, getPool } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";
import { PLAY_COINS, WIN_COINS } from "./top-trumps.js";

loadEnv();

const hasDb = Boolean(
  process.env.DATABASE_URL?.startsWith("mysql") && process.env.SESSION_SECRET,
);

describe.runIf(hasDb)("play routes", () => {
  const app = createApp();
  const a = request.agent(app);
  const b = request.agent(app);
  const emailA = `play-a-${Date.now()}@example.com`;
  const emailB = `play-b-${Date.now()}@example.com`;
  let carA = 0;
  let carB = 0;

  beforeAll(async () => {
    await seedAccounts();
    expect((await a.post("/auth/signup").send({ email: emailA, password: "PlayPass-123!", displayName: "Player A" })).status).toBe(201);
    expect((await b.post("/auth/signup").send({ email: emailB, password: "PlayPass-123!", displayName: "Player B" })).status).toBe(201);

    const search = await request(app).get("/cars/search").query({ sort: "price_asc", limit: 10 });
    const affordable = search.body.listings.filter((l: { coinPrice: number }) => l.coinPrice <= 80);
    carA = affordable[0].id;
    carB = affordable[1].id;
    expect((await a.post(`/trade/listings/${carA}/buy`)).status).toBe(200);
    expect((await b.post(`/trade/listings/${carB}/buy`)).status).toBe(200);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE email IN (?, ?)", [emailA, emailB]);
    await closePool();
  });

  it("lists categories with higher/lower directions", async () => {
    const res = await request(app).get("/play/top-trumps/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(3);
    expect(res.body.rewards.win).toBe(WIN_COINS);
  });

  it("plays Top Trumps vs the house and credits play_reward coins", async () => {
    const before = await a.get("/trade/wallet");
    const play = await a.post("/play/top-trumps/house").send({ listingId: carA, category: "bhp" });
    expect(play.status).toBe(201);
    expect(["challenger", "opponent", "draw"]).toContain(play.body.match.winner);
    expect(play.body.match.coinReward).toBeGreaterThanOrEqual(PLAY_COINS);
    expect(play.body.balance).toBeGreaterThanOrEqual(before.body.balance + PLAY_COINS);

    const wallet = await a.get("/trade/wallet");
    expect(wallet.body.ledger.some((e: { reason: string }) => e.reason === "play_reward")).toBe(true);
  });

  it("plays PvP Top Trumps between two owned cards", async () => {
    const play = await a.post("/play/top-trumps/pvp").send({
      listingId: carA,
      opponentListingId: carB,
      category: "zero_to_sixty_secs",
    });
    expect(play.status).toBe(201);
    expect(play.body.match.mode).toBe("pvp");
    expect(play.body.match.opponent.userId).toBeTruthy();
  });

  it("creates and accepts a free card trade", async () => {
    const offer = await a.post("/play/trades").send({
      offerListingId: carA,
      requestListingId: carB,
    });
    expect(offer.status).toBe(201);
    const tradeId = offer.body.trade.id as number;

    const accept = await b.post(`/play/trades/${tradeId}/accept`);
    expect(accept.status).toBe(200);

    const garageA = await a.get("/trade/garage");
    const garageB = await b.get("/trade/garage");
    expect(garageA.body.cars.some((c: { id: number }) => c.id === carB)).toBe(true);
    expect(garageB.body.cars.some((c: { id: number }) => c.id === carA)).toBe(true);
  });
});
