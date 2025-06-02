// server/api/search.get.ts
import type { FacilityLite, StateFacilities } from "~/core/types/facility";

const STATE_ABBRS = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

// helpers for query parsing / matching
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;
const toBool = (v: string | string[] | undefined) => first(v) === "true";
const match = (field: string, value: string, exact: boolean) =>
  exact ? field === value : field.includes(value);

export default defineEventHandler(async (event) => {
  const q = getQuery(event) as Record<string, string | string[]>;

  // 1. FETCH & CACHE ALL “by‐state” JSONs ONCE
  // We fetch each state JSON from GitHub Pages. 50 requests, once per cold start.
  // Cache in globalThis so subsequent calls within same server process reuse it.
  let states: StateFacilities[] = (globalThis as any).__cacheStates;
  if (!states) {
    const fetched: StateFacilities[] = [];
    for (const abbr of STATE_ABBRS) {
      const url = `https://data-liberation-project.github.io/epa-rmp-viewer/data/facilities/by-state/${abbr}.json`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          // skip missing or invalid state file
          continue;
        }
        const json = (await res.json()) as StateFacilities;
        fetched.push(json);
      } catch {
        // on network error or parse error, just skip this state
        continue;
      }
    }
    (globalThis as any).__cacheStates = fetched;
    states = fetched;
  }

  // 2. FLATTEN TO A SINGLE ARRAY OF FacilityLite
  let rows: FacilityLite[] = states.flatMap((s) =>
    s.counties.flatMap((c) =>
      c.facilities.map((f) => ({
        ...f,
        state: { name: s.name, abbr: s.abbr },
      }))
    )
  );

  // 3. EXTRACT FILTERS + PAGINATION PARAMS
  const name = first(q.facilityName)?.toLowerCase() || "";
  const exactName = toBool(q.exactFacilityName);
  const parent = first(q.parentCompany)?.toLowerCase() || "";
  const exactParent = toBool(q.exactParent);
  const address = first(q.address)?.toLowerCase() || "";
  const exactAddress = toBool(q.exactAddress);
  const id = first(q.facilityId) || "";
  const city = first(q.city) || "";
  const st = first(q.state) || "";
  const county = first(q.county) || "";
  const activeOnly = toBool(q.activeOnly);

  const page = Math.max(1, parseInt(first(q.page) || "1", 10));
  const perPage = Math.max(1, parseInt(first(q.perPage) || "20", 20));
  const offset = (page - 1) * perPage;

  // 4. APPLY FILTERS
  if (name) {
    rows = rows.filter((f) => match(f.name.toLowerCase(), name, exactName));
  }

  if (parent) {
    rows = rows.filter((f) => {
      const c1 = (f as any).company_1?.toLowerCase() ?? "";
      const c2 = (f as any).company_2?.toLowerCase() ?? "";
      return (
        (c1 && match(c1, parent, exactParent)) ||
        (c2 && match(c2, parent, exactParent))
      );
    });
  }

  if (address) {
    rows = rows.filter(
      (f) => f.address && match(f.address.toLowerCase(), address, exactAddress)
    );
  }

  if (id) rows = rows.filter((f) => f.EPAFacilityID === id);
  if (st) rows = rows.filter((f) => f.state.abbr === st);
  if (county) rows = rows.filter((f: any) => f.county_fips === county);
  if (city) rows = rows.filter((f: any) => f.city === city);
  if (activeOnly) rows = rows.filter((f) => !f.sub_last?.date_dereg);

  // 5. SLICE + RETURN
  const total = rows.length;
  const facilities = rows.slice(offset, offset + perPage);
  return { total, page, perPage, facilities };
});
