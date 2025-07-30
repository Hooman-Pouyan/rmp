import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_MHzI4XLo3qgY@ep-empty-glade-a8rez4wb-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});
