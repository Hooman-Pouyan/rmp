import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { FacilityLite, StateFacilities } from "~/core/types/facility";

const ROOT = join(process.cwd(), "data/facilities/by-state");

// helpers
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;
const toBool = (v: string | string[] | undefined) => first(v) === "true";
const match = (field: string, value: string, exact: boolean) =>
  exact ? field === value : field.includes(value);

export default defineEventHandler((event) => {
  const q: any = getQuery(event);

  const states: StateFacilities[] =
    (globalThis as any).__cacheStates ||
    ((globalThis as any).__cacheStates = readdirSync(ROOT).map((f) =>
      JSON.parse(readFileSync(join(ROOT, f), "utf8"))
    ));

  let rows: FacilityLite[] = states.flatMap((s) =>
    s.counties.flatMap((c) =>
      c.facilities.map((f) => ({
        ...f,
        state: {
          name: s.name,
          abbr: s.abbr,
        },
      }))
    )
  );

  // -------- filters ----------
  const name = first(q.facilityName)?.toLowerCase();
  const parent = first(q.parentCompany)?.toLowerCase();
  const address = first(q.address)?.toLowerCase();
  const id = first(q.facilityId);
  const city = first(q.city);
  const st = first(q.state);
  const county = first(q.county);
  const activeOnly = toBool(q.activeOnly);

  const exactName = toBool(q.exactFacilityName);
  const exactParent = toBool(q.exactParent);
  const exactAddress = toBool(q.exactAddress);

  if (name)
    rows = rows.filter((f) => match(f.name.toLowerCase(), name, exactName));

  if (parent && rows.some((f) => "company_1" in f))
    rows = rows.filter(
      (f: any) =>
        f.company_1 && match(f.company_1.toLowerCase(), parent, exactParent)
    );

  if (address)
    rows = rows.filter(
      (f) => f.address && match(f.address.toLowerCase(), address, exactAddress)
    );

  if (id) rows = rows.filter((f) => f.EPAFacilityID === id);
  if (st) rows = rows.filter((f) => f.state.abbr === st);
  if (county) rows = rows.filter((f: any) => f.county_fips === county);
  if (city) rows = rows.filter((f: any) => f.city === city);
  if (activeOnly) rows = rows.filter((f) => !f.sub_last?.date_dereg);

  return { total: rows.length, facilities: rows.slice(0, 500) };
});
