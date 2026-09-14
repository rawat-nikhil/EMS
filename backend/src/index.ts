import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { seedUsers } from "./seed/seedAdmin.js";

async function main(): Promise<void> {
  await connectDb();
  await seedUsers();
  app.listen(env.PORT, () => {
    console.log(`Backend running on http://localhost:${env.PORT}`);
  });
}

main().catch((err: unknown) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
