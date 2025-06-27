// server/api/search.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../utils/drizzle.server'
import {
  tbls1Facilities,
  tbls1Processes,
  tbls1Processchemicals,
  tbls1ProcessNaics,
  tbls6Accidenthistory,
  tlkpchemicals,
} from '../../drizzle/schema'
import { eq, ilike, and, sql, inArray, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  /* ─────────────────────────── 1. read/query-params ────────────────────────── */
  const q      = getQuery(event) as Record<string, string | string[] | undefined>
  const first  = (v?: string | string[]) => Array.isArray(v) ? v[0] : (v || '')
  const toBool = (v?: string | string[]) => first(v).toLowerCase() === 'true'

  /* facility-level */
  const facilityName      = first(q.facilityName).trim()
  const exactFacilityName = toBool(q.exactFacilityName)
  const facilityIdFilter  = first(q.facilityId).trim()
  const parentCompany     = first(q.ParentCompanyName).trim()
  const exactParent       = toBool(q.exactParent)
  const facilityDUNS      = first(q.facilityDUNS).trim()
  const address           = first(q.address).trim()
  const exactAddress      = toBool(q.exactAddress)
  const city              = first(q.city).trim()
  const state             = first(q.state).toUpperCase().trim()
  const zip               = first(q.zip).trim()

  /* process-level */
  const chemicalIds = Array.isArray(q.chemicals)
    ? q.chemicals.map(Number)
    : first(q.chemicals) ? [Number(first(q.chemicals))] : []

  const programLevelFilter = first(q.programLevel) ? Number(first(q.programLevel)) : null

  const naicsCodesFilter = Array.isArray(q.naicsCodes)
    ? q.naicsCodes
    : first(q.naicsCodes) ? [first(q.naicsCodes)] : []

  /* accident-level */
  const hasAccidents  = toBool(q.hasAccidents)

  const accFromDate   = first(q.accFromDate)   // YYYY-MM-DD
  const accToDate     = first(q.accToDate)
  const accFromTime   = first(q.accFromTime)   // HH:mm
  const accToTime     = first(q.accToTime)

  /* pagination */
  const page    = Math.max(1, parseInt(first(q.page) || '1', 10))
  const perPage = first(q.perPage)?.toLowerCase() === 'all'
      ? Number.MAX_SAFE_INTEGER
      : Math.max(1, parseInt(first(q.perPage) || '20', 10))
  const offset  = (page - 1) * perPage

  /* ─────────────────────────── 2. WHERE clauses ───────────────────────────── */
  /* 2a. facility conditions */
  const facWhere: any[] = []
  if (facilityName) facWhere.push(
    exactFacilityName
      ? eq(sql`lower(${tbls1Facilities.facilityName})`, facilityName.toLowerCase())
      : ilike(tbls1Facilities.facilityName, `%${facilityName}%`)
  )
  if (facilityIdFilter) facWhere.push(eq(tbls1Facilities.epaFacilityId, facilityIdFilter))
  if (parentCompany) facWhere.push(
    exactParent
      ? eq(sql`lower(${tbls1Facilities.parentCompanyName})`, parentCompany.toLowerCase())
      : ilike(tbls1Facilities.parentCompanyName, `%${parentCompany}%`)
  )
  if (facilityDUNS) facWhere.push(eq(tbls1Facilities.facilityDuns, Number(facilityDUNS)))
  if (address) facWhere.push(
    exactAddress
      ? eq(sql`lower(${tbls1Facilities.facilityStr1})`, address.toLowerCase())
      : ilike(tbls1Facilities.facilityStr1, `%${address}%`)
  )
  if (city)  facWhere.push(eq(sql`lower(${tbls1Facilities.facilityCity})`, city.toLowerCase()))
  if (state) facWhere.push(eq(tbls1Facilities.facilityState, state))
  if (zip)   facWhere.push(eq(tbls1Facilities.facilityZipCode, zip))

  /* 2b. process conditions */
  const procWhere: any[] = []
  if (programLevelFilter !== null) procWhere.push(eq(tbls1Processes.programLevel, programLevelFilter))
  if (chemicalIds.length)          procWhere.push(inArray(tbls1Processchemicals.chemicalId, chemicalIds))
  if (naicsCodesFilter.length)     procWhere.push(inArray(tbls1ProcessNaics.naicsCode, naicsCodesFilter))

  /* 2c. accident conditions */
  const accWhere: any[] = []
  if (hasAccidents) {
    // must have ≥1 linked accident row
    const needAccJoin = true                      // <-- force the join
    accWhere.push(
      sql`${tbls6Accidenthistory.accidentHistoryId} IS NOT NULL`
    )
  }
  if (accFromDate) accWhere.push(gte(tbls6Accidenthistory.accidentDate, accFromDate))
  if (accToDate)   accWhere.push(lte(tbls6Accidenthistory.accidentDate, accToDate))
  if (accFromTime) accWhere.push(gte(tbls6Accidenthistory.accidentTime, accFromTime))
  if (accToTime)   accWhere.push(lte(tbls6Accidenthistory.accidentTime, accToTime))

  /* If any accident filter is present, we must join tbls6Accidenthistory */
  const needAccJoin = accWhere.length > 0

  /* ─────────────────────────── 3. total-count query ───────────────────────── */
  let countQ = db
    .select({
      count: sql<number>`count(distinct ${tbls1Facilities.epaFacilityId})`.mapWith(Number)
    })
    .from(tbls1Facilities)
    .leftJoin(tbls1Processes,
      eq(tbls1Processes.facilityId, tbls1Facilities.facilityId))
    .leftJoin(tbls1Processchemicals,
      eq(tbls1Processchemicals.processId, tbls1Processes.processId))
    .leftJoin(tbls1ProcessNaics,
      eq(tbls1ProcessNaics.processId, tbls1Processes.processId))

  if (needAccJoin) {
    countQ = countQ.leftJoin(
      tbls6Accidenthistory,
      eq(tbls6Accidenthistory.facilityId, tbls1Facilities.facilityId)
    )
  }

  const [{ count }] = await countQ
    .where(and(...facWhere, ...procWhere, ...accWhere))
    .execute()

  const total = count || 0

  /* ───────────────────────── 4. pick page of EPA IDs ─────────────────────── */
  let pagedQ = db
    .select({ epaId: tbls1Facilities.epaFacilityId })
    .from(tbls1Facilities)
    .leftJoin(tbls1Processes,
      eq(tbls1Processes.facilityId, tbls1Facilities.facilityId))
    .leftJoin(tbls1Processchemicals,
      eq(tbls1Processchemicals.processId, tbls1Processes.processId))
    .leftJoin(tbls1ProcessNaics,
      eq(tbls1ProcessNaics.processId, tbls1Processes.processId))

  if (needAccJoin) {
    pagedQ = pagedQ.leftJoin(
      tbls6Accidenthistory,
      eq(tbls6Accidenthistory.facilityId, tbls1Facilities.facilityId)
    )
  }

  const paged = pagedQ
    .where(and(...facWhere, ...procWhere, ...accWhere))
    .groupBy(tbls1Facilities.epaFacilityId)
    .orderBy(tbls1Facilities.epaFacilityId)
    .limit(perPage)
    .offset(offset)
    .as('paged')

  /* ───────────────────────── 5. facility header rows ─────────────────────── */
  const facRows = await db
    .select({
      facilityId:        tbls1Facilities.epaFacilityId,
      facilityName:      tbls1Facilities.facilityName,
      address:           tbls1Facilities.facilityStr1,
      city:              tbls1Facilities.facilityCity,
      state:             tbls1Facilities.facilityState,
      zipcode:           tbls1Facilities.facilityZipCode,
      facilityURL:       tbls1Facilities.facilityUrl,
      facilityLat:       tbls1Facilities.facilityLatDecDegs,
      facilityLong:      tbls1Facilities.facilityLongDecDegs,
      parentCompanyName: tbls1Facilities.parentCompanyName,
      facilityDUNS:      tbls1Facilities.facilityDuns,
      operatorName:      tbls1Facilities.operatorName,
      noAccidents:       tbls1Facilities.noAccidents,
    })
    .from(tbls1Facilities)
    .innerJoin(paged, eq(tbls1Facilities.epaFacilityId, paged.epaId))
    .execute()

  /* ─────────────────── 6. processes / chemicals / NAICS ─────────────────── */
  const subRows = await db
    .select({
      facilityId:   tbls1Facilities.epaFacilityId,
      chemicalId:   tbls1Processchemicals.chemicalId,
      quantity:     tbls1Processchemicals.quantity,
      chemicalName: tlkpchemicals.chemicalName,
      naicsCode:    tbls1ProcessNaics.naicsCode,
      programLevel: tbls1Processes.programLevel,
    })
    .from(tbls1Processes)
    .innerJoin(tbls1Facilities,
      eq(tbls1Processes.facilityId, tbls1Facilities.facilityId))
    .innerJoin(paged,
      eq(tbls1Facilities.epaFacilityId, paged.epaId))
    .leftJoin(tbls1Processchemicals,
      eq(tbls1Processes.processId, tbls1Processchemicals.processId))
    .leftJoin(tlkpchemicals,
      eq(tbls1Processchemicals.chemicalId, tlkpchemicals.chemicalId))
    .leftJoin(tbls1ProcessNaics,
      eq(tbls1Processes.processId, tbls1ProcessNaics.processId))
    .execute()

  /* ─────────────────────────── 7. accident rows ─────────────────────────── */
  const accRows = await db
    .select({
      facilityId:           tbls1Facilities.epaFacilityId,
      accidentHistoryId:    tbls6Accidenthistory.accidentHistoryId,
      accidentDate:         tbls6Accidenthistory.accidentDate,
      accidentTime:         tbls6Accidenthistory.accidentTime,
      reGas:                tbls6Accidenthistory.reGas,
      reSpill:              tbls6Accidenthistory.reSpill,
      reFire:               tbls6Accidenthistory.reFire,
      reExplosion:          tbls6Accidenthistory.reExplosion,
      reReactiveIncident:   tbls6Accidenthistory.reReactiveIncident,
      cfEquipmentFailure:   tbls6Accidenthistory.cfEquipmentFailure,
      cfHumanError:         tbls6Accidenthistory.cfHumanError,
      cfImproperProcedure:  tbls6Accidenthistory.cfImproperProcedure,
      cfOverpressurization: tbls6Accidenthistory.cfOverpressurization,
      cfUpsetCondition:     tbls6Accidenthistory.cfUpsetCondition,
      cfBypassCondition:    tbls6Accidenthistory.cfBypassCondition,
      cfMaintenance:        tbls6Accidenthistory.cfMaintenance,
      cfProcessDesignFailure: tbls6Accidenthistory.cfProcessDesignFailure,
      cfUnsuitableEquipment:  tbls6Accidenthistory.cfUnsuitableEquipment,
      cfUnusualWeather:       tbls6Accidenthistory.cfUnusualWeather,
      cfManagementError:      tbls6Accidenthistory.cfManagementError,
      cfOther:                tbls6Accidenthistory.cfOther,
    })
    .from(tbls6Accidenthistory)
    .innerJoin(tbls1Facilities,
      eq(tbls6Accidenthistory.facilityId, tbls1Facilities.facilityId))
    .innerJoin(paged,
      eq(tbls1Facilities.epaFacilityId, paged.epaId))
    .where(and(...accWhere))   // ensure date/time filters apply here too
    .execute()

  /* ───────────────────── 8. JS-side assembly per facility ────────────────── */
  const facMap: Record<string, any> = {}
  facRows.forEach(f => {
    facMap[f.facilityId!] = {
      ...f,
      chemicals:    [] as any[],
      naicsCode:    null as string | null,
      programLevel: null as number | null,
      accidents:    [] as any[],
    }
  })

  subRows.forEach(s => {
    const fac = facMap[s.facilityId]
    if (!fac) return
    if (s.chemicalId != null &&
        !fac.chemicals.some((c:any) => c.chemicalId === s.chemicalId)) {
      fac.chemicals.push({
        chemicalId:   s.chemicalId,
        quantity:     s.quantity,
        chemicalName: s.chemicalName,
      })
    }
    if (!fac.naicsCode && s.naicsCode) fac.naicsCode = s.naicsCode
    if (s.programLevel != null) {
      fac.programLevel = fac.programLevel == null
        ? s.programLevel
        : Math.max(fac.programLevel, s.programLevel)
    }
  })

  accRows.forEach(a => {
    const fac = facMap[a.facilityId]
    if (!fac) return
    if (!fac.accidents.some((x:any) => x.accidentHistoryId === a.accidentHistoryId)) {
      fac.accidents.push({ ...a })
    }
  })

  /* ─────────────────────────── 9. final payload ─────────────────────────── */
  const facilities = Object.values(facMap).map(f => ({
    ...f,
    accidents: f.accidents.length ? f.accidents : null,
  }))

  return {
    total,
    page,
    perPage: perPage === Number.MAX_SAFE_INTEGER ? total : perPage,
    facilities,
  }
})