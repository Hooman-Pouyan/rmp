import { db } from "../../utils/drizzle.server";
import {
  tbls1Facilities,
  tbls1Processes,
  tbls1Processchemicals,
  tbls1ProcessNaics,
  tbls9Emergencyresponses,
  tlkpchemicals,
  tbls6Accidenthistory,
  tbls6Accidentchemicals
} from "../../../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";

export const getAllSubmissionsWithDetails = async () => {
  // Subquery for chemicals aggregation per process

const accidentSubquery = db
  .select({
    facilityId: tbls6Accidenthistory.facilityId,
    accidents: sql`
      json_agg(
        json_build_object(
          'accidentHistoryId', ${tbls6Accidenthistory.accidentHistoryId},
          'accidentDate', ${tbls6Accidenthistory.accidentDate},
          'accidentTime', ${tbls6Accidenthistory.accidentTime},
          'reGas', ${tbls6Accidenthistory.reGas},
          'reSpill', ${tbls6Accidenthistory.reSpill},
          'reFire', ${tbls6Accidenthistory.reFire},
          'reExplosion', ${tbls6Accidenthistory.reExplosion},
          'reReactiveIncident', ${tbls6Accidenthistory.reReactiveIncident},
          'cfEquipmentFailure', ${tbls6Accidenthistory.cfEquipmentFailure},
          'cfHumanError', ${tbls6Accidenthistory.cfHumanError},
          'cfImproperProcedure', ${tbls6Accidenthistory.cfImproperProcedure},
          'cfOverpressurization', ${tbls6Accidenthistory.cfOverpressurization},
          'cfUpsetCondition', ${tbls6Accidenthistory.cfUpsetCondition},
          'cfBypassCondition', ${tbls6Accidenthistory.cfBypassCondition},
          'cfMaintenance', ${tbls6Accidenthistory.cfMaintenance},
          'cfProcessDesignFailure', ${tbls6Accidenthistory.cfProcessDesignFailure},
          'cfUnsuitableEquipment', ${tbls6Accidenthistory.cfUnsuitableEquipment},
          'cfUnusualWeather', ${tbls6Accidenthistory.cfUnusualWeather},
          'cfManagementError', ${tbls6Accidenthistory.cfManagementError},
          'cfOther', ${tbls6Accidenthistory.cfOther}
        )
      )
    `.as("accidents"),
  })
  .from(tbls6Accidenthistory)
  .groupBy(tbls6Accidenthistory.facilityId)
  .as("accidents_by_facility");


  const chemicalsSubquery = db
    .select({
      processId: tbls1Processchemicals.processId,
      chemicals: sql`
        json_agg(
          json_build_object(
            'chemicalId', ${tbls1Processchemicals.chemicalId},
            'quantity', ${tbls1Processchemicals.quantity},
            'chemicalName', ${tlkpchemicals.chemicalName}
          )
        )
      `.as("chemicals"),
    })
    .from(tbls1Processchemicals)
    .leftJoin(
      tlkpchemicals,
      eq(tbls1Processchemicals.chemicalId, tlkpchemicals.chemicalId)
    )
    .groupBy(tbls1Processchemicals.processId)
    .as("chemicals_group");

  // Subquery for NAICS aggregation per process
  const naicsSubquery = db
    .select({
      processId: tbls1ProcessNaics.processId,
      naicsCodes: sql`
        json_agg(${tbls1ProcessNaics.naicsCode})
      `.as("naicsCodes"),
    })
    .from(tbls1ProcessNaics)
    .groupBy(tbls1ProcessNaics.processId)
    .as("naics_group");

  // Final main query
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
      chemicals: sql`"chemicals_group"."chemicals"`,
      naicsCode: sql`"naics_group"."naicsCodes"`,
      accidents: accidentSubquery.accidents,
    })
    .from(tbls1Facilities)
    .leftJoin(tbls1Processes, eq(tbls1Processes.facilityId, tbls1Facilities.facilityId))
    .leftJoin(chemicalsSubquery, eq(chemicalsSubquery.processId, tbls1Processes.processId))
    .leftJoin(naicsSubquery, eq(naicsSubquery.processId, tbls1Processes.processId))
    .leftJoin(tbls9Emergencyresponses, eq(tbls1Facilities.facilityId, tbls9Emergencyresponses.facilityId))
    .leftJoin(accidentSubquery, eq(tbls1Facilities.facilityId, accidentSubquery.facilityId))
    .execute();

  return submissions;
};

export default defineEventHandler(async () => {
  const submissions = await getAllSubmissionsWithDetails();
  return submissions;
});