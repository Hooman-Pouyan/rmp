// server/api/accidents/geo.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../utils/drizzle.server'
import {
  tbls6Accidenthistory,
  tbls6Accidentchemicals,
  tlkpchemicals,
  tbls1Facilities
} from '~/drizzle/schema'
import { eq } from 'drizzle-orm'
import { useFacilitiesStore } from '~/store/facilities'

export default defineEventHandler(async () => {

    // const store = useFacilitiesStore()
  const rows = await db
    .select({
      id:               tbls6Accidenthistory.accidentHistoryId,
      facilityId:       tbls6Accidenthistory.facilityId,
      EPAFacilityID: tbls1Facilities.epaFacilityId,
      date:             tbls6Accidenthistory.accidentDate,
      time:             tbls6Accidenthistory.accidentTime,
      naicsCode:        tbls6Accidenthistory.naicsCode,
      releaseDuration:  tbls6Accidenthistory.accidentReleaseDuration,
      reGas:            tbls6Accidenthistory.reGas,
      reSpill:          tbls6Accidenthistory.reSpill,
      reFire:           tbls6Accidenthistory.reFire,
      reExplosion:      tbls6Accidenthistory.reExplosion,
      initiatingEvent:  tbls6Accidenthistory.initiatingEvent,
      cfEquipment:      tbls6Accidenthistory.cfEquipmentFailure,
      cfHumanError:     tbls6Accidenthistory.cfHumanError,
      // … any other columns you want …

      lat: tbls1Facilities.facilityLatDecDegs,
      lon: tbls1Facilities.facilityLongDecDegs
    })
    .from(tbls6Accidenthistory)
    .innerJoin(tbls1Facilities, eq(
      tbls6Accidenthistory.facilityId,
      tbls1Facilities.facilityId
    ))
    .execute()

  const features = rows.map(r => {
    const lat = parseFloat(r.lat as any)
    const lon = parseFloat(r.lon as any)
    if (isNaN(lat) || isNaN(lon)) return null
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        id:              String(r.id),
        EPAFacilityID  : String(r.EPAFacilityID), 
        facilityId:      String(r.facilityId),
        accidentDate:    r.date,
        accidentTime:    r.time,
        naicsCode:       r.naicsCode,
        releaseDuration: r.releaseDuration,
        reGas:           r.reGas,
        reSpill:         r.reSpill,
        reFire:          r.reFire,
        reExplosion:     r.reExplosion,
        initiatingEvent: r.initiatingEvent,
        cfEquipment:     r.cfEquipment,
        cfHumanError:    r.cfHumanError,
      }
    }
  }).filter(Boolean)

  return { type: 'FeatureCollection', features }
})