// server/api/search-accidents.get.ts
import { defineEventHandler } from "h3";
import { tblS6AccidentHistory } from "../../db/schema"; // Adjust to match your schema
import { db } from "../../utils/drizzle.server";

export default defineEventHandler(async () => {
  // better-sqlite3 is synchronous, so .all() is fine here
  const rows = db.select().from(tblS6AccidentHistory).limit(40).all();
  return rows; // automatically serialised to JSON
});
