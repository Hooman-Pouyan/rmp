// server/api/facilities/geo.get.ts
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { db } from '../../utils/drizzle.server'
import {
  tbls1Facilities,
  tbls1Processes,
} from '../../../drizzle/schema'
import { sql, and } from 'drizzle-orm'

// Query helper with optional bbox
async function fetchFacilities (
  minx?: number | null,
  miny?: number | null,
  maxx?: number | null,
  maxy?: number | null
) {
  const hasBBox = [minx, miny, maxx, maxy].every(
    v => typeof v === 'number' && !Number.isNaN(v as number)
  )

  const rowsQ = db
    .selectDistinctOn([tbls1Facilities.epaFacilityId], {
      EPAFacilityID: tbls1Facilities.epaFacilityId,
      name:         tbls1Facilities.facilityName,
      address:      tbls1Facilities.facilityStr1,
      city:         tbls1Facilities.facilityCity,
      state:        tbls1Facilities.facilityState,
      zipcode:      tbls1Facilities.facilityZipCode,
      facilityURL:  tbls1Facilities.facilityUrl,
      parentCompany: tbls1Facilities.parentCompanyName,
      facilityDUNS: tbls1Facilities.facilityDuns,
      operatorName: tbls1Facilities.operatorName,
      // Cast to numeric in SQL
      lat: sql<number>`TRIM(${tbls1Facilities.facilityLatDecDegs})::double precision`.mapWith(Number),
      lon: sql<number>`TRIM(${tbls1Facilities.facilityLongDecDegs})::double precision`.mapWith(Number),
      // Keep program level via cheap correlated MAX (used by optional layers)
      pLevel: sql<number>`
        COALESCE(
          (SELECT MAX(${tbls1Processes.programLevel})
             FROM ${tbls1Processes}
            WHERE ${tbls1Processes.facilityId} = ${tbls1Facilities.facilityId}
          ),
          0
        )
      `.mapWith(Number),
    })
    .from(tbls1Facilities)
    .where(
      and(
        sql`${tbls1Facilities.validLatLongFlag} = 'Yes'`,
        sql`(TRIM(${tbls1Facilities.facilityLatDecDegs})::double precision) >= 0`,
        sql`(TRIM(${tbls1Facilities.facilityLongDecDegs})::double precision) < 0`,
        ...(hasBBox
          ? [
              sql`(TRIM(${tbls1Facilities.facilityLongDecDegs})::double precision) BETWEEN ${minx} AND ${maxx}`,
              sql`(TRIM(${tbls1Facilities.facilityLatDecDegs})::double precision) BETWEEN ${miny} AND ${maxy}`,
            ]
          : [])
      )
    )

  return rowsQ.execute()
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event) as Record<string, string | undefined>

  // Optional viewport bounding box (lon/lat in WGS84)
  const minx = q.minx ? Number(q.minx) : null
  const miny = q.miny ? Number(q.miny) : null
  const maxx = q.maxx ? Number(q.maxx) : null
  const maxy = q.maxy ? Number(q.maxy) : null

  // 5‑minute in‑memory cache keyed by bbox
  const cacheKey = JSON.stringify({ minx, miny, maxx, maxy })
  const now = Date.now()
  const TTL = 5 * 60 * 1000
  const g: any = globalThis as any
  g.__facCache = g.__facCache || new Map<string, { t:number; data:any }>()
  const hit = g.__facCache.get(cacheKey)
  if (hit && (now - hit.t) < TTL) {
    setHeader(event, 'Cache-Control', 'public, max-age=300')
    return hit.data
  }

  const rows = await fetchFacilities(minx, miny, maxx, maxy)

  const features = rows
    .map(r => {
      if (r.lat == null || r.lon == null || Number.isNaN(r.lat) || Number.isNaN(r.lon)) return null
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
        properties: {
          EPAFacilityID: String(r.EPAFacilityID),
          name: r.name,
          address: r.address,
          city: r.city,
          state: r.state,
          zipcode: r.zipcode,
          facilityURL: r.facilityURL,
          parentCompany: r.parentCompany,
          facilityDUNS: r.facilityDUNS,
          operatorName: r.operatorName,
          pLevel: String(r.pLevel ?? ''),
        }
      }
    })
    .filter(Boolean)

  const data = { type: 'FeatureCollection', features }
  g.__facCache.set(cacheKey, { t: now, data })
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  return data
})
