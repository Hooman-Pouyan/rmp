
// server/utils/drizzle.server.ts
import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_cv1fUMVBzys8@ep-dry-feather-a86o3jvs-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require",  
  ssl: { rejectUnauthorized: false },
  // this is the magic bit:
})

export const db = drizzle(pool)
