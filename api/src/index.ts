import { createApp } from "./app.js";
import { closePool } from "./db.js";
import { loadEnv } from "./env.js";
import { seedAccounts } from "./seed.js";

loadEnv();

const port = Number(process.env.API_PORT ?? 5174);

async function main(): Promise<void> {
  await seedAccounts();
  const app = createApp();
  const server = app.listen(port, "127.0.0.1", () => {
    console.log(`BradApp API listening on http://127.0.0.1:${port}`);
  });

  const shutdown = async () => {
    server.close();
    await closePool();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
