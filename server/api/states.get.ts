// server/api/facilities/by-state/index.get.ts

import type { StateFacilities } from "~/core/types/facility";

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

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;
const toLower = (v: string | string[] | undefined) =>
  typeof v === "string" ? v.toLowerCase() : "";

export default defineEventHandler(async (event) => {
  const q = getQuery(event) as Record<string, string | string[]>;

  // 1. FETCH & CACHE ALL “by‐state” JSONs ONCE
  let states: StateFacilities[] = (globalThis as any).__cacheStates || [];
  if (!states.length) {
    const fetched: StateFacilities[] = [];
    for (const abbr of STATE_ABBRS) {
      const url = `https://data-liberation-project.github.io/epa-rmp-viewer/data/facilities/by-state/${abbr}.json`;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = (await res.json()) as StateFacilities;
        fetched.push(json);
      } catch {
        continue;
      }
    }
    (globalThis as any).__cacheStates = fetched;
    states = fetched;
  }

  // 2. FILTER ON name OR abbr IF PROVIDED
  const nameQuery = toLower(first(q.name));
  const abbrQuery = toLower(first(q.abbr));

  let results = states;
  if (nameQuery) {
    results = results.filter((st) => st.name.toLowerCase() === nameQuery);
  }
  if (abbrQuery) {
    results = results.filter((st) => st.abbr.toLowerCase() === abbrQuery);
  }

  // 3. RETURN
  // If you only need “name”+“abbr” (no counties) you can map accordingly:
  // return results.map((st) => ({ name: st.name, abbr: st.abbr }));

  // If you do want the full “StateFacilities” shape (including counties/facilities),
  // just return “results” directly:
  return results;
});
