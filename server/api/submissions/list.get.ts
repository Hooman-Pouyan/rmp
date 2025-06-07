import { db } from "../../utils/drizzle.server"; // Adjust path accordingly
import {
  tbls1Facilities,
  tbls1Processes,
  tbls1Processchemicals,
  tbls1ProcessNaics,
  tbls9Emergencyresponses,
  tlkpchemicals,
} from "../../../drizzle/schema"; // Adjust path accordingly
import { eq } from "drizzle-orm";

const getAllSubmissionsWithDetails = async () => {
  const submissions = await db
    .select({
      submissionId: tbls1Facilities.facilityId,
      facilityName: tbls1Facilities.facilityName,
      facilityId: tbls1Facilities.epaFacilityId,
      address: tbls1Facilities.facilityStr1,
      state: tbls1Facilities.facilityState,
      city: tbls1Facilities.facilityCity,
      zipcode: tbls1Facilities.facilityZipCode,
      facilityURL: tbls1Facilities.facilityUrl,
      facilityLat: tbls1Facilities.facilityLatDecDegs,
      facilityLong: tbls1Facilities.facilityLongDecDegs,
      parentCompanyName: tbls1Facilities.parentCompanyName,
      facilityDUNS: tbls1Facilities.facilityDuns,
      operatorName: tbls1Facilities.operatorName,
      noAccidents: tbls1Facilities.noAccidents,
      programLevel: tbls1Processes.programLevel,

      // // Aggregating chemicals for each facility
      // chemicals: db
      //   .select({
      //     chemicalId: tbls1Processchemicals.chemicalId,
      //     quantity: tbls1Processchemicals.quantity,
      //     chemicalName: tlkpchemicals.chemicalName,
      //   })
      //   .from(tbls1Processchemicals)
      //   .leftJoin(tlkpchemicals, eq(tlkpchemicals.chemicalId, tbls1Processchemicals.chemicalId))
      //   .where(eq(tbls1Processchemicals.processId, tbls1Processes.processId))
      //   .groupBy(tbls1Processchemicals.processId)  // Grouping by the processId to aggregate
      //   .as("chemicals"),  // Alias for the aggregation

      // // Aggregating naicsCode for each process
      // naicsCode: db
      //   .select({
      //     naicsCode: tbls1ProcessNaics.naicsCode,
      //   })
      //   .from(tbls1ProcessNaics)
      //   .where(eq(tbls1ProcessNaics.processId, tbls1Processes.processId))
      //   .groupBy(tbls1ProcessNaics.processId)  // Grouping by the processId
      //   .as("naicsCode"),  // Alias for the aggregation
    })
    .from(tbls1Facilities)
    .leftJoin(tbls1Processes, eq(tbls1Processes.facilityId, tbls1Facilities.facilityId))
    .leftJoin(tbls1ProcessNaics, eq(tbls1Processes.processId, tbls1ProcessNaics.processId))
    .leftJoin(tbls1Processchemicals, eq(tbls1Processes.processId, tbls1Processchemicals.processId))
    .leftJoin(tlkpchemicals, eq(tbls1Processchemicals.chemicalId, tlkpchemicals.chemicalId))
    .leftJoin(tbls9Emergencyresponses, eq(tbls1Facilities.facilityId, tbls9Emergencyresponses.facilityId))
    .execute();

  return submissions;
};


// API handler
export default defineEventHandler(async () => {
  const submissions = await getAllSubmissionsWithDetails();
  return submissions; // Return the submissions data
});