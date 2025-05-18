// server/api/facilities.geo.get.ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { StateFacilities } from "~/core/types/facility";
// import { useFacilitiesStore } from "~/store/facilities";

const ROOT = join(process.cwd(), "data/facilities/by-state");

// const store = useFacilitiesStore();

export default defineEventHandler(() => {
  const states = readdirSync(ROOT).map(
    (f) => JSON.parse(readFileSync(join(ROOT, f), "utf8")) as StateFacilities
  );

  // console.log(store.results);

  const features = states.flatMap((s) =>
    s.counties.flatMap((c) =>
      c.facilities.map((f) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(f.sub_last!.lon_sub as any),
            parseFloat(f.sub_last!.lat_sub as any),
          ],
        },
        properties: {
          id: f.EPAFacilityID,
          name: f.name,
          city: f.city,
          state: s.abbr,
          lastDate: f.sub_last!.date_val,
          accidents: f.sub_last!.num_accidents ?? 0,
        },
      }))
    )
  );

  return { type: "FeatureCollection", features };
});
