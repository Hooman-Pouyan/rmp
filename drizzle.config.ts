import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // 1. Where to write the generated schema:
  out: "./drizzle",
  schema: "./server/db/schema.ts",
  dialect: "sqlite",
  // 3. Credentials pointing at your existing SQLite file:
  dbCredentials: {
    url: "./server/db/RMPData.sqlite",
  },
});
