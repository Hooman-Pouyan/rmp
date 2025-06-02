// server/api/facilities/geo.get.ts
import type { StateFacilities, FacilityLite } from "~/core/types/facility";

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

// Each “by-state” JSON lives at:
// https://data-liberation-project.github.io/epa-rmp-viewer/data/facilities/by-state/{ABBR}.json

export default defineEventHandler(async () => {
  // 1. FETCH & CACHE ALL STATES’ DATA (once per Node process)
  let states: StateFacilities[] = (globalThis as any).__cacheStates_geo || [];
  if (!states.length) {
    const fetched: StateFacilities[] = [];
    for (const abbr of STATE_ABBRS) {
      const url = `https://data-liberation-project.github.io/epa-rmp-viewer/data/facilities/by-state/${abbr}.json`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          // Skip any missing or invalid state file
          continue;
        }
        const json = (await res.json()) as StateFacilities;
        fetched.push(json);
      } catch {
        // If network or parsing fails, skip this state
        continue;
      }
    }
    (globalThis as any).__cacheStates_geo = fetched;
    states = fetched;
  }

  // 2. FLATTEN ALL FACILITIES INTO GEOJSON “features” ARRAY
  const features = states.flatMap((s) =>
    s.counties.flatMap((c) =>
      c.facilities.map((f: FacilityLite) => {
        // Each FacilityLite is expected to have sub_last with lat_sub, lon_sub, etc.
        const lat = parseFloat(f.sub_last?.lat_sub as unknown as string);
        const lon = parseFloat(f.sub_last?.lon_sub as unknown as string);
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          properties: {
            id: f.EPAFacilityID,
            name: f.name,
            city: f.city,
            state: s.abbr,
            lastDate: f.sub_last?.date_val,
            accidents: f.sub_last?.num_accidents ?? 0,
          },
        };
      })
    )
  );

  // 3. RETURN AS A GEOJSON FeatureCollection
  return {
    type: "FeatureCollection",
    features,
  };
});
