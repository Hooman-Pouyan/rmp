// server/api/facilities/geo.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../utils/drizzle.server'
import {
  tbls1Facilities,
  tbls1Processes,
  tbls1Processchemicals,
  tbls1ProcessNaics,
  tbls6Accidenthistory,
  tlkpchemicals,
} from '../../../drizzle/schema'
import { eq, sql } from 'drizzle-orm'
import { useFacilitiesStore } from '~/store/facilities'

// A helper to run the same logic you use in /api/search but returning all facilities
async function fetchAllFacilities() {
  // (Re-use your search logic, but no WHERE, page=all)
  // ... you’d basically copy the "4) pick page" + "5) fetch headers" + "6/7 subRows/accRows" + JS nesting
  // For brevity I’ll demo a simplified version that fetches just the columns we need:
  return db
    .selectDistinctOn([tbls1Facilities.epaFacilityId, tbls1Facilities.facilityName],{
      EPAFacilityID:    tbls1Facilities.epaFacilityId,
      name:             tbls1Facilities.facilityName,
      pLevel : sql<number>`
        coalesce( 
          (select max(${tbls1Processes.programLevel})
             from ${tbls1Processes}
            where ${tbls1Processes.facilityId} = ${tbls1Facilities.facilityId}),
          0
        )`.mapWith(Number),
      address:          tbls1Facilities.facilityStr1,
      city:             tbls1Facilities.facilityCity,
      state:            tbls1Facilities.facilityState,
      zipcode:          tbls1Facilities.facilityZipCode,
      facilityURL:      tbls1Facilities.facilityUrl,
      facilityLat:      tbls1Facilities.facilityLatDecDegs,
      facilityLong:     tbls1Facilities.facilityLongDecDegs,
      parentCompany:    tbls1Facilities.parentCompanyName,
      facilityDUNS:     tbls1Facilities.facilityDuns,
      operatorName:     tbls1Facilities.operatorName,
      noAccidents:      tbls1Facilities.noAccidents,

      // you can continue to pull anything else:
      company_2:        tbls1Facilities.company2Name,
      county_fips:      tbls1Facilities.facilityCountyFips,
      submissionType:   tbls1Facilities.submissionType,
      // … etc …

      // (then later you’d fetch subRows + accRows and attach them)
    })
    .from(tbls1Facilities)
    .execute()
}

export default defineEventHandler(async () => {
  const facs = await fetchAllFacilities()

  const features = facs.map(f => {
    const lat = parseFloat(f.facilityLat as any)
    const lon = parseFloat(f.facilityLong as any)
    if (isNaN(lat) || isNaN(lon)) return null

    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        ...f,
        pLevel: String(f.pLevel ?? ''),
        // make sure numeric IDs are strings for ArcGIS
        EPAFacilityID: String(f.EPAFacilityID),
      }
    }
  }).filter(Boolean)

  return {
    type: 'FeatureCollection',
    features
  }
})