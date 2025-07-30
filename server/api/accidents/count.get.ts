import { defineEventHandler } from 'h3'
import { db } from '../../utils/drizzle.server'
import { tbls6Accidenthistory, tbls1Facilities } from '~/drizzle/schema'
import { sql, and } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const [{ count }] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(tbls6Accidenthistory)
    .innerJoin(
      tbls1Facilities,
      sql`${tbls6Accidenthistory.facilityId} = ${tbls1Facilities.facilityId}`
    )
    .where(and(
      sql`(${tbls1Facilities.validLatLongFlag} = 'Yes')`,
      sql`(TRIM(${tbls1Facilities.facilityLatDecDegs})::float >= 0)`,
      sql`(TRIM(${tbls1Facilities.facilityLongDecDegs})::float < 0)`
    ))
    .execute()

  return { totalAccidents: count }
})