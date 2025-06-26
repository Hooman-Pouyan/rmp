import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://RMP%3DSearch-db_owner:npg_eaElAq7I9ofR@ep-bitter-haze-a8xnlyx7-pooler.eastus2.azure.neon.tech/RMP%3DSearch-db?sslmode=require&channel_binding=require",
  },
});
