# BradApp

A Carwow-style car world for Brad and friends — accounts first. Real cars later; no real money.

## Stack

- **Web:** React, TypeScript, Vite, Tailwind (port **5173**)
- **API:** one TypeScript Express service (port **5174**)
- **DB:** MySQL 8 via Docker Compose

## Roles

| Role | Who |
| --- | --- |
| `super_admin` | Napwood (parent). Seed optionally via `SEED_SUPER_ADMIN_*` env vars. |
| `admin` | Brad — seeded as `bradapp.admin@gmail.com` (password hash only in repo). |
| `member` | Friends and family via self-serve sign-up. |

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

Optional Napwood seed (hashed at runtime, never logged):

```bash
# in .env
SEED_SUPER_ADMIN_EMAIL=you@example.com
SEED_SUPER_ADMIN_PASSWORD=…   # your secret; not committed
SEED_SUPER_ADMIN_NAME=Napwood
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
