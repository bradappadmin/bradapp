import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { createActivityRouter } from "./activity-routes.js";
import { createAdminRouter } from "./admin-routes.js";
import { createAuthRouter } from "./auth-routes.js";
import { createCarsRouter } from "./cars-routes.js";
import { createMembersRouter } from "./members-routes.js";
import { createPlayRouter } from "./play-routes.js";
import { createReviewsRouter } from "./reviews-routes.js";
import { createTradeRouter } from "./trade-routes.js";

export function createApp(): Express {
  const app = express();
  const origin = process.env.CORS_ORIGIN ?? "http://127.0.0.1:5173";

  app.use(
    cors({
      origin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "bradapp-api" });
  });

  app.use("/auth", createAuthRouter());
  app.use("/cars", createCarsRouter());
  app.use("/members", createMembersRouter());
  app.use("/activity", createActivityRouter());
  app.use("/trade", createTradeRouter());
  app.use("/play", createPlayRouter());
  app.use("/reviews", createReviewsRouter());
  app.use("/admin", createAdminRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found", message: "Not found." });
  });

  return app;
}
