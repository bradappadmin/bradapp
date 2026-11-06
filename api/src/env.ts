import path from "node:path";
import dotenv from "dotenv";

/** Load repo `.env`, overriding ambient CI/cloud vars such as unrelated DATABASE_URL values. */
export function loadEnv(): void {
  dotenv.config({ path: path.resolve(process.cwd(), "../.env"), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
}
