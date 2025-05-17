import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { FacilityLite, StateFacilities } from "~/core/types/facility";

const ROOT = join(process.cwd(), "/data/facilities/by-state");

function first(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default defineEventHandler((event) => {
  const q: any = getQuery(event);
  const states: StateFacilities[] =
    (globalThis as any).__cacheStates ||
    ((globalThis as any).__cacheStates = readdirSync(ROOT).map((f) =>
      JSON.parse(readFileSync(join(ROOT, f), "utf8"))
    ));

  let rows: FacilityLite[] = states.flatMap((s) =>
    s.counties.flatMap((c) => c.facilities)
  );

  const name = first(q.facilityName)?.toLowerCase();
  const id = first(q.facilityId);
  const st = first(q.state);
  const co = first(q.county);
  const active = first(q.activeOnly) === "true";

  if (name) rows = rows.filter((f) => f.name.toLowerCase().includes(name));
  if (id) rows = rows.filter((f) => f.EPAFacilityID === id);
  if (st) rows = rows.filter((f) => f.state === st);
  if (co) rows = rows.filter((f: any) => f.county_fips === co);
  if (active) rows = rows.filter((f) => !f.sub_last?.date_dereg);

  return { total: rows.length, facilities: rows.slice(0, 500) };
});
