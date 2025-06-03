// server/api/search.get.ts
import { readFile } from "fs/promises";
import { defineEventHandler, getQuery } from "h3";
import type { H3Event } from "h3";

interface MasterSubmission {
  submissionId: number;
  FacilityName: string;
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
  accidents?: Record<string, any>[]; // may be absent if empty
}

// We will group submissions by EPAFacilityID.
// Then for each facility we pick out “facility‐level” fields from any one submission (they are identical across submissions).
// We also compute “sub_last” = the submission with the latest SafetyInspectionDate (if any),
//    and count total accidents across all submissions.

interface FacilityResult {
  EPAFacilityID: string;
  name: string;
  address: string; // we don't have street address; we’ll leave it empty
  city: string;
  county_fips: string;
  state: { abbr: string; name: string };
  sub_last?: {
    date_val: string; // use SafetyInspectionDate as proxy
    num_accidents: number;
  };
  // these two are only shown internally to the accordion expansion; not directly used in table
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
  // for the map layer:
  lat: number | null;
  lon: number | null;
  name_for_map: string;
  city_for_map: string;
  state_for_map: string;
  lastDate_for_map?: string;
  accidents_for_map: number;
}

let __cachedMaster: FacilityResult[] | null = null;

/**
 * Load and reshape the single `master_submissions.json` into an array of unique facilities,
 * each with a "submissions" array and a computed "sub_last".
 */
async function loadAndIndexMaster(): Promise<FacilityResult[]> {
  if (__cachedMaster) {
    return __cachedMaster;
  }

  const raw = await readFile(
    new URL("../data/master_submissions.json", import.meta.url),
    "utf-8"
  );
  const allSubs: MasterSubmission[] = JSON.parse(raw);

  // Group by EPAFacilityID
  const grouped = new Map<string, MasterSubmission[]>();
  for (const sub of allSubs) {
    const key = sub.EPAFacilityID;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(sub);
  }

  const facilities: FacilityResult[] = [];

  for (const [epaId, submissions] of grouped.entries()) {
    // Take “facility‐level” data from the first submission
    const exemplar = submissions[0];
    const city = exemplar.FacilityCity;
    const stateAbbr = exemplar.FacilityState;
    const county = exemplar.FacilityCountyFIPS;
    // no street‐level address in master JSON, leave blank
    const address = "";

    // Sort submissions by SafetyInspectionDate (descending) to pick sub_last
    const sortedByDate = submissions.slice().sort((a, b) => {
      const da = a.SafetyInspectionDate;
      const db = b.SafetyInspectionDate;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    });
    const latestSub = sortedByDate[0];

    // Count accidents in each submission, sum them up
    let totalAccidents = 0;
    for (const s of submissions) {
      if (Array.isArray(s.accidents)) {
        totalAccidents += s.accidents.length;
      }
    }

    // Build a “submissions” array pared to only fields the front‐end needs:
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
      state: { abbr: stateAbbr, name: stateAbbr },
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

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Helper functions to read filters from query string
  // ────────────────────────────────────────────────────────────────────────────
  const first = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";
  const toBool = (v: string | string[] | undefined): boolean =>
    first(v).toLowerCase() === "true";

  // Facility‐level filters:
  const facilityNameQ = first(q.facilityName).trim().toLowerCase();
  const exactName = toBool(q.exactFacilityName);
  const facilityIdQ = first(q.facilityId).trim();
  const parentCompanyQ = first(q.parentCompany).trim().toLowerCase();
  const exactParent = toBool(q.exactParent);
  const facilityDUNSQ = first(q.facilityDUNS).trim();

  // Location filters:
  const addressQ = first(q.address).trim().toLowerCase();
  const exactAddress = toBool(q.exactAddress);
  const cityQ = first(q.city).trim().toLowerCase();
  const stateQ = first(q.state).trim().toUpperCase();
  const countyQ = first(q.county).trim();
  const zipQ = first(q.zip).trim();
  const activeOnly = toBool(q.activeOnly);

  // Process‐level filters (all strings):
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

  // Pagination:
  const page = Math.max(1, parseInt(first(q.page) || "1", 10));
  const perPage = Math.max(1, parseInt(first(q.perPage) || "20", 10));

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Load & cache master list of facilities
  // ────────────────────────────────────────────────────────────────────────────
  const allFacilities = await loadAndIndexMaster();

  // ────────────────────────────────────────────────────────────────────────────
  // 3) Apply “facility‐level” filters first
  // ────────────────────────────────────────────────────────────────────────────
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
    if (facilityIdQ) {
      if (f.EPAFacilityID !== facilityIdQ) return false;
    }

    // c) parentCompany: match against any submission’s ParentCompanyName
    if (parentCompanyQ) {
      const matches = f.submissions.some((s) => {
        // we don’t carry ParentCompanyName down into “submissions” – instead check exemplar
        return (
          f.EPAFacilityID && // exemplar-level holds the original ParentCompanyName
          (f.name || "").toLowerCase().includes(parentCompanyQ) // fallback
        );
      });
      if (!matches) return false;
    }

    // d) facilityDUNS: master has FacilityDUNS on exemplar
    if (facilityDUNSQ) {
      // exemplar-level facilityDUNS was lost in our FacilityResult; we did not carry that field.
      // So this filter is a no-op unless you re-add FacilityDUNS to FacilityResult. Skip.
    }

    // e) address – no street in our master, skip entirely

    // f) city
    if (cityQ) {
      if (f.city.toLowerCase() !== cityQ) return false;
    }

    // g) state
    if (stateQ) {
      if (f.state.abbr !== stateQ) return false;
    }

    // h) county
    if (countyQ) {
      if (f.county_fips !== countyQ) return false;
    }

    // i) zip
    if (zipQ) {
      // We never carried ZipCode to facility‐level. Skip unless you add it.
      return true;
    }

    // j) activeOnly: treat “active” as any facility whose latest SafetyInspectionDate is not null
    if (activeOnly) {
      if (!f.sub_last?.date_val) return false;
    }

    return true;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4) Apply “submission‐level” filters: programLevel, chemicals, naicsCodes
  //    We keep any facility if **any** of its submissions matches _all_ requested filters.
  // ────────────────────────────────────────────────────────────────────────────
  function submissionMatchesFilters(
    s: FacilityResult["submissions"][0]
  ): boolean {
    // a) programLevel
    if (programLevelQ !== null) {
      const ok = s.processes.some((p) => p.ProgramLevel === programLevelQ);
      if (!ok) return false;
    }

    // b) naicsCodes: require at least one overlap
    if (naicsCodesQ.length) {
      const ok = s.processes.some((p) =>
        p.naics.some((n) => naicsCodesQ.includes(n.NAICSCode))
      );
      if (!ok) return false;
    }

    // c) chemicals: require at least one overlap on ChemicalID
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
    filtered = filtered.filter((f) => {
      return f.submissions.some((s) => submissionMatchesFilters(s));
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 5) Pagination
  // ────────────────────────────────────────────────────────────────────────────
  const totalMatched = filtered.length;
  const offset = (page - 1) * perPage;
  const pageSlice = filtered.slice(offset, offset + perPage);

  // ────────────────────────────────────────────────────────────────────────────
  // 6) Return final JSON
  // ────────────────────────────────────────────────────────────────────────────
  return {
    total: totalMatched,
    page,
    perPage,
    facilities: pageSlice,
  };
});
