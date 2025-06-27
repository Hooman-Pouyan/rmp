// import { db } from "../../utils/drizzle.server"; // Assuming path
// import { tblS1Facilities } from "~/server/db/schema"; // Adjust path accordingly

// const getAllFacilities = async () => {
//   const facilities = await db
//     .select({
//       facilityId: tblS1Facilities.facilityId,
//       facilityName: tblS1Facilities.facilityName,
//       facilityCity: tblS1Facilities.facilityCity,
//       facilityState: tblS1Facilities.facilityState,
//       facilityZipCode: tblS1Facilities.facilityZipCode,
//       facilityCountyFips: tblS1Facilities.facilityCountyFips,
//     })
//     .from(tblS1Facilities)
//     .all();

//   return facilities;
// };

// export default defineEventHandler(async () => {
//   const facilities = await getAllFacilities();

//   return facilities; // Return a list of all facilities
// });
