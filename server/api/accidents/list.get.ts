// server/api/search-accidents.get.ts
import { defineEventHandler } from "h3";
import { tbls6Accidenthistory } from "../../../drizzle/schema"; // Adjust to match your schema
import { db } from "../../utils/drizzle.server";

export default defineEventHandler(async () => {
  // better-sqlite3 is synchronous, so .all() is fine here
  const accidents = await db.select().from(tbls6Accidenthistory);
  console.log('Getting all users from the database: ', accidents)
  return accidents; // automatically serialised to JSON
});
