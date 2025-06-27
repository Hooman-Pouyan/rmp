import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
export const db = drizzle("postgresql://rmp_owner:npg_RC2P5cxwstGo@ep-silent-truth-a8s192bk-pooler.eastus2.azure.neon.tech/rmp?sslmode=require&channel_binding=require");