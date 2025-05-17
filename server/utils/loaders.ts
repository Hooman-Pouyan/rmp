import { join } from 'node:path'
import Database from 'better-sqlite3'
// import type { StateFacilities } from '~/types/facility'

/* ---------- JSON helpers ---------- */
const DATA_ROOT = join(process.cwd(), 'data', 'facilities')

export function readState(abbr: string): any {
  return require(join(DATA_ROOT, 'by-state', `${abbr}.json`))
}

export function readFacility(id: string) {
  return require(join(DATA_ROOT, 'detail', `${id}.json`))
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
