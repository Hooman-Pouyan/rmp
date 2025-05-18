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

  let rows: StateFacilities[] = states.map((s) => ({
    name: s.name,
    abbr: s.abbr,
    counties: s.counties,
  }));

  console.log({ rows });

  // -------- filters ----------
  const name = first(q.name)?.toLowerCase();
  const abbr = first(q.abbr)?.toLowerCase();

  if (name) rows = rows.filter((f) => f.name.toLowerCase() == name);
  if (abbr) rows = rows.filter((f) => f.abbr.toLowerCase() == abbr);

  if (name) rows = rows.filter((f) => f.name === name);
  if (abbr) rows = rows.filter((f) => f.abbr === abbr);

  return rows;
});
