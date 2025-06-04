import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema"; // path may differ
import path from "path";

const DB_FILE =
  process.env.RMP_DB_PATH ??
  path.resolve(process.cwd(), "data", "RMPdata.sqlite");

const sqlite = new Database(DB_FILE);
export const db = drizzle(sqlite, { schema });
