import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://rmp_owner:npg_RC2P5cxwstGo@ep-silent-truth-a8s192bk-pooler.eastus2.azure.neon.tech/rmp?sslmode=require&channel_binding=require",
  },
});
