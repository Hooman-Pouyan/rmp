import { join } from 'node:path'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'; 
// import type { StateFacilities } from '~/types/facility'

/* ---------- JSON helpers ---------- */
const DATA_ROOT = join(process.cwd(), 'data', 'facilities')

export function readState(abbr: string): any {
  return require(join(DATA_ROOT, 'by-state', `${abbr}.json`))
}

export function readFacility(id: string) {
  const path = join(
    process.cwd(),
    "data",
    "facilities",
    "detail",
    `${id}.json`
  );
  try {
    const json = readFileSync(path, "utf-8");
    return JSON.parse(json);
  } catch (error) {
    console.error(`Error loading facility ${id}:`, error);
    return null;
  }
}

/* ---------- SQLite helper (for future) ---------- */
let db: any | null = null
export function getDB(): any {
  if (db) return db
  db = new Database(join(process.cwd(), 'db', 'RMPData.sqlite'), {
    readonly: true
  })
  return db
}
