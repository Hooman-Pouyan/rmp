import { defineEventHandler, getQuery, sendStream } from 'h3'
import { Readable } from 'stream'
import { db } from '../utils/drizzle.server'
import { tbls1Facilities } from '../../drizzle/schema'
import { sql, eq } from 'drizzle-orm'
import { Parser } from 'json2csv'

export default defineEventHandler(async (event) => {
  const q = getQuery(event) as Record<string,string>
  // (repeat your search.where logic, but no pagination)
  const rows = await db.select({
    epaId:   tbls1Facilities.epaFacilityId,
    name:    tbls1Facilities.facilityName,
    state:   tbls1Facilities.facilityState,
    city:    tbls1Facilities.facilityCity,
    parent:  tbls1Facilities.parentCompanyName,
  })
  .from(tbls1Facilities)
//   .where(/* same facWhere + coord filters */)
  .execute()

  const fields = ['epaId','name','state','city','parent']
  const csv    = new Parser({ fields }).parse(rows)
  event.node.res.setHeader('Content-Type','text/csv')
  event.node.res.setHeader('Content-Disposition','attachment; filename="facilities.csv"')
  // Convert CSV buffer into a readable stream
  const csvBuffer = Buffer.from(csv)
  const csvStream = Readable.from([csvBuffer])
  return sendStream(event, csvStream)
})
