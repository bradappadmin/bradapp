import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { createAuthRouter } from "./auth-routes.js";
import { createCarsRouter } from "./cars-routes.js";
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
  app.use("/trade", createTradeRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found", message: "Not found." });
  });

  return app;
}
