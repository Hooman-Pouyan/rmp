import { defineEventHandler, setHeader } from 'h3'
import { db } from '../../utils/drizzle.server'
import { tbls6Accidenthistory, tbls1Facilities } from '~/drizzle/schema'
import { sql, and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Single pass: compute both totals with DISTINCT safeguards
  const [{ total, latest }] = await db
    .select({
      total:  sql<number>`
        count(distinct ${tbls6Accidenthistory.accidentHistoryId})
      `.mapWith(Number),
      latest: sql<number>`
        count(
          distinct case
            when (${tbls6Accidenthistory.accidentDate}::date) >= (CURRENT_DATE - INTERVAL '5 years')
            then ${tbls6Accidenthistory.accidentHistoryId}
          end
        )
      `.mapWith(Number),
    })
    .from(tbls6Accidenthistory)
    .innerJoin(
      tbls1Facilities,
      eq(tbls6Accidenthistory.facilityId, tbls1Facilities.facilityId)
    )
    .where(and(
      sql`${tbls1Facilities.validLatLongFlag} = 'Yes'`,
      sql`(TRIM(${tbls1Facilities.facilityLatDecDegs})::double precision) >= 0`,
      sql`(TRIM(${tbls1Facilities.facilityLongDecDegs})::double precision) < 0`
    ))
    .execute()

  // small cache hint
  setHeader(event, 'Cache-Control', 'public, max-age=300')

  return {
    totalAccidents:  total ?? 0,
    latestAccidents: latest ?? 0, // last 5 years
  }
})