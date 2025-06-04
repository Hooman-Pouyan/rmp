// server/api/search.get.ts

import { readFile } from "fs/promises";
import { defineEventHandler, getQuery, createError } from "h3";
import type { H3Event } from "h3";
import { join } from "path";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

interface MasterSubmission {
  submissionId: number;
  FacilityName: string;
  FacilityAddress: string;
  FacilityCity: string;
  FacilityState: string;
  FacilityZipCode: string;
  FacilityCountyFIPS: string;
  FacilityLatDecDegs: string;
  FacilityLongDecDegs: string;
  ValidLatLongFlag: string;
  LatLongMethod: string;
  LatLongDescription: string;
  FacilityURL: string | null;
  FacilityDUNS: string | null;
  ParentCompanyName: string | null;
  Company2Name: string | null;
  CompanyDUNS: string | null;
  Company2DUNS: string | null;
  OperatorName: string;
  EPAFacilityID: string;
  SafetyInspectionDate: string | null;
  SafetyInspectionBy: string | null;
  SubmissionType: string;
  RMPDescription: string | null;
  NoAccidents: string;
  ForeignCountry: string | null;
  FRS_Lat: number | null;
  FRS_Long: number | null;
  processes: Array<{
    ProcessID: number;
    ProgramLevel: number;
    chemicals: Array<{ ProcessChemicalID: number; ChemicalID: number }>;
    naics: Array<{ NAICSCode: string }>;
    MH_ToxicRelease: boolean;
  }>;
  accidents?: Record<string, any>[];
}

interface FacilityResult {
  EPAFacilityID: string;
  name: string;
  address: string;
  city: string;
  county_fips: string;
  state: { abbr: string; name: string };
  zip: string;
  facilityDUNS: string | null;
  parentCompany: string | null;
  sub_last?: {
    date_val: string;
    num_accidents: number;
  };
  submissions: Array<{
    submissionId: number;
    SafetyInspectionDate: string | null;
    num_accidents: number;
    processes: Array<{
      ProcessID: number;
      ProgramLevel: number;
      chemicals: Array<{ ProcessChemicalID: number; ChemicalID: number }>;
      naics: Array<{ NAICSCode: string }>;
      MH_ToxicRelease: boolean;
    }>;
  }>;
  lat: number | null;
  lon: number | null;
  name_for_map: string;
  ParentCompanyName: string;
  city_for_map: string;
  state_for_map: string;
  lastDate_for_map?: string;
  accidents_for_map: number;
}

let __cachedMaster: FacilityResult[] | null = null;

async function loadAndIndexMaster(): Promise<FacilityResult[]> {
  if (__cachedMaster) return __cachedMaster;

  const jsonPath = join(process.cwd(), "static/data/master_submissions.json");
  let raw: string;
  try {
    raw = await readFile(jsonPath, "utf-8");
  } catch {
    throw createError({
      statusCode: 500,
      message: `Cannot load master JSON at ${jsonPath}`,
    });
  }

  const allSubs: MasterSubmission[] = JSON.parse(raw);
  const grouped = new Map<string, MasterSubmission[]>();

  for (const sub of allSubs) {
    const key = sub.EPAFacilityID;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(sub);
  }

  const facilities: FacilityResult[] = [];

  for (const [epaId, submissions] of grouped.entries()) {
    const exemplar = submissions[0];
    const city = exemplar.FacilityCity;
    const stateAbbr = exemplar.FacilityState;
    const county = exemplar.FacilityCountyFIPS;
    const address = exemplar.FacilityAddress;
    const zip = exemplar.FacilityZipCode;
    const facilityDUNS = exemplar.FacilityDUNS;
    const parentCompany = exemplar.ParentCompanyName;

    const sortedByDate = submissions.slice().sort((a, b) => {
      const da = a.SafetyInspectionDate;
      const db = b.SafetyInspectionDate;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    });
    const latestSub = sortedByDate[0];

    let totalAccidents = 0;
    for (const s of submissions) {
      if (Array.isArray(s.accidents)) {
        totalAccidents += s.accidents.length;
      }
    }

    const subsForApi = submissions.map((s) => ({
      submissionId: s.submissionId,
      SafetyInspectionDate: s.SafetyInspectionDate,
      num_accidents: Array.isArray(s.accidents) ? s.accidents.length : 0,
      processes: s.processes.map((p) => ({
        ProcessID: p.ProcessID,
        ProgramLevel: p.ProgramLevel,
        chemicals: p.chemicals.slice(),
        naics: p.naics.slice(),
        MH_ToxicRelease: p.MH_ToxicRelease,
      })),
    }));

    facilities.push({
      EPAFacilityID: epaId,
      name: exemplar.FacilityName,
      address,
      city,
      county_fips: county,
      state: {
        abbr: stateAbbr,
        name: STATE_NAMES[stateAbbr] || stateAbbr,
      },
      zip,
      facilityDUNS,
      parentCompany,
      sub_last:
        latestSub.SafetyInspectionDate !== null
          ? {
              date_val: latestSub.SafetyInspectionDate!,
              num_accidents: latestSub.accidents?.length ?? 0,
            }
          : undefined,
      submissions: subsForApi,
      lat: exemplar.FRS_Lat,
      lon: exemplar.FRS_Long,
      name_for_map: exemplar.FacilityName,
      ParentCompanyName: exemplar.ParentCompanyName || "N/A",
      city_for_map: city,
      state_for_map: stateAbbr,
      lastDate_for_map: latestSub.SafetyInspectionDate ?? undefined,
      accidents_for_map: totalAccidents,
    });
  }

  __cachedMaster = facilities;
  return facilities;
}

export default defineEventHandler(async (event: H3Event) => {
  const q = getQuery(event) as Record<string, string | string[]>;
  console.log({ q });

  const first = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";
  const toBool = (v: string | string[] | undefined): boolean =>
    first(v).toLowerCase() === "true";

  // Facility‐level filters
  const facilityNameQ = first(q.facilityName).trim().toLowerCase();
  const exactName = toBool(q.exactFacilityName);
  const facilityIdQ = first(q.facilityId).trim();
  const parentCompanyQ = first(q.ParentCompanyName).trim().toLowerCase();
  const exactParent = toBool(q.exactParent);
  const facilityDUNSQ = first(q.facilityDUNS).trim();

  // Location filters
  const addressQ = first(q.address).trim().toLowerCase();
  const exactAddress = toBool(q.exactAddress);
  const cityQ = first(q.city).trim().toLowerCase();
  const stateQ = first(q.state).trim().toUpperCase();
  const countyQ = first(q.county).trim();
  const zipQ = first(q.zip).trim();
  const activeOnly = toBool(q.activeOnly);

  // Process‐level filters
  const chemicalsQ = Array.isArray(q.chemicals)
    ? (q.chemicals as string[])
    : first(q.chemicals)
    ? [first(q.chemicals)]
    : [];
  const programLevelQ = first(q.programLevel)
    ? parseInt(first(q.programLevel), 10)
    : null;
  const naicsCodesQ = Array.isArray(q.naicsCodes)
    ? (q.naicsCodes as string[])
    : first(q.naicsCodes)
    ? [first(q.naicsCodes)]
    : [];

    const perPageRaw = first(q.perPage) || '20'
const unlimited  = perPageRaw === '0' || perPageRaw.toLowerCase() === 'all'
const perPage    = unlimited ? Number.MAX_SAFE_INTEGER
                              : Math.max(1, parseInt(perPageRaw, 10))

  // Pagination
  const page = Math.max(1, parseInt(first(q.page) || "1", 10));

  const allFacilities = await loadAndIndexMaster();

  // 3) Facility‐level filtering
  let filtered = allFacilities.filter((f) => {
    // a) facilityName
    if (facilityNameQ) {
      const nameField = f.name.toLowerCase();
      if (exactName) {
        if (nameField !== facilityNameQ) return false;
      } else {
        if (!nameField.includes(facilityNameQ)) return false;
      }
    }

    // b) facilityId
    if (facilityIdQ && f.EPAFacilityID !== facilityIdQ) {
      return false;
    }

    // c) parentCompany
    if (parentCompanyQ) {
      const pc = f.parentCompany?.toLowerCase() || "";
      if (exactParent) {
        if (pc !== parentCompanyQ) return false;
      } else {
        if (!pc.includes(parentCompanyQ)) return false;
      }
    }

    // d) facilityDUNS
    if (facilityDUNSQ) {
      const duns = f.facilityDUNS || "";
      if (duns !== facilityDUNSQ) return false;
    }

    // e) address
    if (addressQ) {
      const addr = f.address.toLowerCase();
      if (exactAddress) {
        if (addr !== addressQ) return false;
      } else {
        if (!addr.includes(addressQ)) return false;
      }
    }

    // f) city
    if (cityQ && f.city.toLowerCase() !== cityQ) return false;

    // g) state
    if (stateQ && f.state.abbr !== stateQ) return false;

    // h) county
    if (countyQ && f.county_fips !== countyQ) return false;

    // i) zip
    if (zipQ && f.zip !== zipQ) return false;

    // j) activeOnly
    if (activeOnly && !f.sub_last?.date_val) return false;

    return true;
  });

  // 4) Submission‐level filtering
  function submissionMatches(s: FacilityResult["submissions"][0]): boolean {
    if (programLevelQ !== null) {
      const ok = s.processes.some((p) => p.ProgramLevel === programLevelQ);
      if (!ok) return false;
    }
    if (naicsCodesQ.length) {
      const ok = s.processes.some((p) =>
        p.naics.some((n) => naicsCodesQ.includes(n.NAICSCode))
      );
      if (!ok) return false;
    }
    if (chemicalsQ.length) {
      const ok = s.processes.some((p) =>
        p.chemicals.some((c) => chemicalsQ.includes(String(c.ChemicalID)))
      );
      if (!ok) return false;
    }
    return true;
  }

  if (
    programLevelQ !== null ||
    naicsCodesQ.length > 0 ||
    chemicalsQ.length > 0
  ) {
    filtered = filtered.filter((f) =>
      f.submissions.some((s) => submissionMatches(s))
    );
  }

  
  // 5) Pagination
const total   = filtered.length
const slice   = unlimited ? filtered        
                          : filtered.slice((page-1)*perPage, page*perPage)
  const offset = (page - 1) * perPage;
  const pageSlice = filtered.slice(offset, offset + perPage);

return { total, page, perPage: unlimited? total : perPage, facilities: slice }
});
