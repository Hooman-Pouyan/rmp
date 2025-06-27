import { defineEventHandler, getRouterParams } from 'h3'
import { db } from '~/server/utils/drizzle.server'
import {
  tbls6Accidenthistory,
  tbls6Accidentchemicals,
  tlkpchemicals
} from '~/drizzle/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const accId = parseInt(id!, 10)

  // fetch the accident base record
  const [acc] = await db
    .select()
    .from(tbls6Accidenthistory)
    .where(eq(tbls6Accidenthistory.accidentHistoryId, accId))
    .execute()

  if (!acc) {
    event.res.statusCode = 404
    return { error: 'Accident not found' }
  }

  // fetch any chemicals released in that accident
  const chemicals = await db
    .select({
      chemicalId: tlkpchemicals.chemicalId,
      chemicalName: tlkpchemicals.chemicalName,
      quantityReleased: tbls6Accidentchemicals.quantityReleased,
      percentWeight: tbls6Accidentchemicals.percentWeight
    })
    .from(tbls6Accidentchemicals)
    .innerJoin(tlkpchemicals, eq(
      tbls6Accidentchemicals.chemicalId,
      tlkpchemicals.chemicalId
    ))
    .where(eq(tbls6Accidentchemicals.accidentHistoryId, accId))
    .execute()

    console.log(acc, chemicals);
    

  return {
    ...acc,
    chemicals
  }
})