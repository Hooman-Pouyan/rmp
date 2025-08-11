// server/api/accidents/geo.get.ts
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { db } from '../../utils/drizzle.server'
import {
  tbls6Accidenthistory,
  tbls1Facilities
} from '~/drizzle/schema'
import { eq, sql, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const q = getQuery(event) as Record<string, string | undefined>

  // New UI param (preferred): 'latest' | 'all'
  const range = String(q.range || '').toLowerCase()
  const uiLatest = range === 'latest'
  const uiAll    = range === 'all'

  // Back-compat / existing behavior
  const submissionDate = q.submissionDate || null              // 'YYYY-MM-DD' | 'ALL' | null
  const latestOnly     = uiLatest || (!submissionDate && String(q.latestOnly || '').toLowerCase() === 'true')
  const cumulative     = uiAll    || submissionDate === 'ALL'

  // Optional bounding box for large maps (lon/lat in WGS84)
  // minx, miny, maxx, maxy = west, south, east, north
  const minx = q.minx ? Number(q.minx) : null
  const miny = q.miny ? Number(q.miny) : null
  const maxx = q.maxx ? Number(q.maxx) : null
  const maxy = q.maxy ? Number(q.maxy) : null
  const hasBBox = [minx, miny, maxx, maxy].every(v => typeof v === 'number' && !Number.isNaN(v as number))

  // ── simple in‑memory cache (5 min)
  const cacheKey = JSON.stringify({ range, submissionDate, latestOnly, cumulative, minx, miny, maxx, maxy })
  const now = Date.now()
  const CACHE_TTL = 5 * 60 * 1000
  const g: any = globalThis as any
  g.__accCache = g.__accCache || new Map<string, { t:number; data:any }>()
  const cached = g.__accCache.get(cacheKey)
  if (cached && (now - cached.t) < CACHE_TTL) {
    setHeader(event, 'Cache-Control', 'public, max-age=300')
    return cached.data
  }

  // ── base select (only required fields), join facilities once
  const rowsQ = db
    .select({
      id:            tbls6Accidenthistory.accidentHistoryId,
      facilityId:    tbls6Accidenthistory.facilityId,
      EPAFacilityID: tbls1Facilities.epaFacilityId,
      facilityName:  tbls1Facilities.facilityName,
      date:          tbls6Accidenthistory.accidentDate,
      time:          tbls6Accidenthistory.accidentTime,
      naicsCode:     tbls6Accidenthistory.naicsCode,
      // cast to numeric in SQL to avoid per-row parse
      lat:           sql<number>`TRIM(${tbls1Facilities.facilityLatDecDegs})::double precision`.mapWith(Number),
      lon:           sql<number>`TRIM(${tbls1Facilities.facilityLongDecDegs})::double precision`.mapWith(Number),
    })
    .from(tbls6Accidenthistory)
    .innerJoin(
      tbls1Facilities,
      eq(tbls6Accidenthistory.facilityId, tbls1Facilities.facilityId)
    )

  // ── conditions (apply once)
  const conds = [
    sql`${tbls1Facilities.validLatLongFlag} = 'Yes'`,
    sql`(TRIM(${tbls1Facilities.facilityLatDecDegs})::double precision) >= 0`,
    sql`(TRIM(${tbls1Facilities.facilityLongDecDegs})::double precision) <  0`,
  ]

  if (hasBBox) {
    conds.push(
      sql`(TRIM(${tbls1Facilities.facilityLongDecDegs})::double precision) BETWEEN ${minx} AND ${maxx}`,
      sql`(TRIM(${tbls1Facilities.facilityLatDecDegs})::double precision) BETWEEN ${miny} AND ${maxy}`
    )
  }

  // snapshot logic:
  //   - range=latest → last 5 years
  //   - submissionDate=YYYY-MM-DD → <= that date
  //   - range=all or submissionDate=ALL → no date constraint
  if (latestOnly) {
    conds.push(sql`(${tbls6Accidenthistory.accidentDate}::date) >= (CURRENT_DATE - INTERVAL '5 years')`)
  } else if (submissionDate && !cumulative) {
    conds.push(sql`(${tbls6Accidenthistory.accidentDate}::date) <= to_date(${submissionDate}, 'YYYY-MM-DD')`)
  }

  const rows = await rowsQ.where(and(...conds)).execute()

  const features = rows
    .map(r => {
      if (r.lat == null || r.lon == null || Number.isNaN(r.lat) || Number.isNaN(r.lon)) return null
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
        properties: {
          id:            String(r.id),
          EPAFacilityID: String(r.EPAFacilityID),
          name:          r.facilityName,
          facilityId:    String(r.facilityId),
          accidentDate:  r.date,
          accidentTime:  r.time,
          naicsCode:     r.naicsCode,
        }
      }
    })
    .filter(Boolean)

  const data = { type: 'FeatureCollection', features }
  g.__accCache.set(cacheKey, { t: now, data })
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return data
})
