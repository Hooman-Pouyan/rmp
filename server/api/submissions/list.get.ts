import { db } from "../../utils/drizzle.server"; // Assuming path
import {
  tblS1Processes,
  tblS1ProcessChemicals,
  tblS1Process_Naics,
  tblS9EmergencyResponses,
  tblS1Facilities,
  tlkpChemicals,
} from "../../db/schema"; // Adjust path accordingly
import { sql } from "drizzle-orm";

const getAllSubmissionsWithDetails = async () => {
  // Query for fetching submissions with process and emergency response details
  const submissions = db
    .select({
      submissionId: tblS1Facilities.facilityId,
      facilityName: tblS1Facilities.facilityName,
      facilityId: tblS1Facilities.epaFacilityId,
      address: tblS1Facilities.facilityStr1,
      state: tblS1Facilities.facilityState,
      city: tblS1Facilities.facilityCity,
      zipcode: tblS1Facilities.facilityZipCode,
      facilityURL: tblS1Facilities.facilityUrl,
      facilityLat: tblS1Facilities.facilityLatDecDegs,
      facilityLong: tblS1Facilities.facilityLongDecDegs,
      parentCompanyName: tblS1Facilities.parentCompanyName,
      facilityDUNS: tblS1Facilities.facilityDuns,
      operatorName: tblS1Facilities.operatorName,
      noAccidents: tblS1Facilities.noAccidents,
      programLevel: tblS1Processes.programLevel,
      chemicals: sql`(
      SELECT json_group_array(
        json_object(
          'chemicalId', tblS1ProcessChemicals.chemicalId,
          'quantity', tblS1ProcessChemicals.quantity,
          'chemicalName', tlkpChemicals.chemicalName
        )
      )
      FROM tblS1ProcessChemicals
      LEFT JOIN tlkpChemicals ON tlkpChemicals.chemicalId = tblS1ProcessChemicals.chemicalId
      WHERE tblS1ProcessChemicals.processId = tblS1Processes.processId
    )`.as("chemicals"),
      naicsCode: sql`(
      SELECT json_group_array(tblS1Process_Naics.naicsCode)
      FROM tblS1Process_Naics
      WHERE tblS1Process_Naics.processId = tblS1Processes.processId
    )`.as("naicsCode"),
    })
    .from(tblS1Facilities)
    .leftJoin(
      tblS1Processes,
      sql`${tblS1Processes.facilityId} = ${tblS1Facilities.facilityId}`
    )
    .leftJoin(
      tblS1Process_Naics,
      sql`${tblS1Processes.processId} = ${tblS1Process_Naics.processId}`
    )
    .leftJoin(
      tblS1ProcessChemicals,
      sql`${tblS1Processes.processId} = ${tblS1ProcessChemicals.processId}`
    )
    .leftJoin(
      tlkpChemicals,
      sql`${tblS1ProcessChemicals.chemicalId} = ${tlkpChemicals.chemicalId}`
    )
    .leftJoin(
      tblS9EmergencyResponses,
      sql`${tblS1Facilities.facilityId} = ${tblS9EmergencyResponses.facilityId}`
    )
    .all();

  return submissions;
};

export default defineEventHandler(async () => {
  const submissions = await getAllSubmissionsWithDetails();

  return submissions; // Return a list of all submissions with process and emergency response details
});
