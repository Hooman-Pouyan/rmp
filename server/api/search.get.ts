// server/api/search.get.ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { FacilityLite, StateFacilities } from "~/core/types/facility";

const ROOT = join(process.cwd(), "data", "facilities", "by-state");

// helpers
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;
const toBool = (v: string | string[] | undefined) => first(v) === "true";
const match = (field: string, value: string, exact: boolean) =>
  exact ? field === value : field.includes(value);

export default defineEventHandler((event) => {
  const q = getQuery(event) as Record<string, string | string[]>;

  // load & cache
  const states: StateFacilities[] =
    (globalThis as any).__cacheStates ||
    ((globalThis as any).__cacheStates = readdirSync(ROOT).map((fn) =>
      JSON.parse(readFileSync(join(ROOT, fn), "utf8"))
    ));

  // flatten + inject state
  let rows: FacilityLite[] = states.flatMap((s) =>
    s.counties.flatMap((c) =>
      c.facilities.map((f) => ({
        ...f,
        state: { name: s.name, abbr: s.abbr },
      }))
    )
  );

  // pull out filters + pagination
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
  const perPage = Math.max(1, parseInt(first(q.perPage) || "10", 10));
  const offset = (page - 1) * perPage;

  // apply your filters
  if (name)
    rows = rows.filter((f) => match(f.name.toLowerCase(), name, exactName));

  if (parent)
    rows = rows.filter((f) => {
      const c1 = (f as any).company_1?.toLowerCase() ?? "";
      const c2 = (f as any).company_2?.toLowerCase() ?? "";
      return (
        (c1 && match(c1, parent, exactParent)) ||
        (c2 && match(c2, parent, exactParent))
      );
    });

  if (address)
    rows = rows.filter(
      (f) => f.address && match(f.address.toLowerCase(), address, exactAddress)
    );

  if (id) rows = rows.filter((f) => f.EPAFacilityID === id);
  if (st) rows = rows.filter((f) => f.state.abbr === st);
  if (county) rows = rows.filter((f: any) => f.county_fips === county);
  if (city) rows = rows.filter((f) => f.city === city);
  if (activeOnly) rows = rows.filter((f) => !f.sub_last?.date_dereg);

  const total = rows.length;
  const facilities = rows.slice(offset, offset + perPage);

  return { total, page, perPage, facilities };
});
