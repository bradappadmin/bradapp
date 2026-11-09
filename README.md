# BradApp

A Carwow-style car world for Brad and friends. Real cars and specs; made-up garages, listings, and Brad Coin prices. No real money.

## Stack

- **Web:** React, TypeScript, Vite, Tailwind (port **5173**)
- **API:** one TypeScript Express service (port **5174**)
- **DB:** MySQL 8 via Docker Compose

## Roles

| Role | Who |
| --- | --- |
| `super_admin` | Napwood (parent). Seed optionally via `SEED_SUPER_ADMIN_*` env vars. |
| `admin` | Brad — seeded as `bradapp.admin@gmail.com` (password hash only in repo). |
| `member` | Friends and family via self-serve sign-up, plus seeded demo family (below). |

### Demo family (seeded)

Three members ship with cars and Brad Coins so challenges and free trades work immediately after `npm run db:seed`. Emails only — **no plaintext passwords in this repo** (bcrypt hash, same pattern as Brad):

| Email | Display name |
| --- | --- |
| `sam.bay@example.com` | Sam Bay |
| `jordan.lap@example.com` | Jordan Lap |
| `casey.apex@example.com` | Casey Apex |

Optional: set `DEMO_MEMBER_PASSWORD` in `.env` before seeding to hash a shared walkthrough password at runtime (never commit it). Without that env var, the committed bcrypt hash is used — ask Napwood for the walkthrough secret.

## What’s in this slice

- Accounts: sign-up, sign-in, session cookie, signed-in change password (bcrypt)
- Mobile-friendly Midnight Garage layout: collapsible nav, readable forms/lists, usable admin on phone widths
- Car cards: original colour strip + body silhouette cues, BHP / 0–60 / top speed, price or owned badge (no stock photos)
- Car search: real makes/models with realistic specs, invented garages/listings/owners/coin prices
- Filters: make, model, body, fuel, new/used, year range, Brad Coin price range, sort (plus colour / mileage / BHP)
- Brad Coins: balances + ledger; members buy/sell listings (no real money); My cars shows total garage value (sum of list / fair prices)
- Top Trumps: head-to-head (higher BHP/top speed, lower 0–60); playing earns coins; rematch the same opponent with a new card pick
- Free card trades between members; nav Trades badge shows pending inbox count
- Video reviews: record with car cue cards, publish to disk + DB; admins can take down
- Admin area (`/admin`): accounts (freeze/unfreeze), coin corrections + adjust history, cars/garages/listings; members blocked. Napwood can freeze Brad; Brad cannot freeze Napwood.

## Run locally

```bash
cp .env.example .env
# Fill DATABASE_URL from docker-compose MySQL user/db, and set SESSION_SECRET.

npm install
npm run db:up
npm run db:seed
npm run dev:api   # terminal 1 — http://127.0.0.1:5174
npm run dev:web   # terminal 2 — http://127.0.0.1:5173
```

Then open `/cars`, `/garage`, `/play`, `/trades`, `/reviews`, and `/admin` (Brad/Napwood only).

Optional Napwood seed (hashed at runtime, never logged):

```bash
# in .env
SEED_SUPER_ADMIN_EMAIL=you@example.com
SEED_SUPER_ADMIN_PASSWORD=…   # your secret; not committed
SEED_SUPER_ADMIN_NAME=Napwood
```

Optional demo-family password override (hashed at seed, never logged or committed):

```bash
# in .env
DEMO_MEMBER_PASSWORD=…   # shared walkthrough secret for Sam/Jordan/Casey
```

## Checks

```bash
npm run typecheck
npm test
```

## Notes

- Session auth uses an HttpOnly signed cookie (`bradapp_session`).
- Do not commit `.env` or plaintext passwords.
- BradDrive / `shoo0204/bradrive` is reference only — not used by this app.
