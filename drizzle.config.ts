import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_cv1fUMVBzys8@ep-dry-feather-a86o3jvs-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});
