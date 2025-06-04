// server/api/facilities/geo.get.ts
import type { StateFacilities, FacilityLite } from '~/core/types/facility'

const STATE_ABBRS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

export default defineEventHandler(async () => {
  /* ---- 1. fetch + cache all 50 state JSON blobs (once per worker) ---- */
  let states: StateFacilities[] = (globalThis as any).__cacheStates_geo || []
  if (!states.length) {
    const tmp: StateFacilities[] = []
    for (const abbr of STATE_ABBRS) {
      try {
        const res = await fetch(
          `https://data-liberation-project.github.io/epa-rmp-viewer/data/facilities/by-state/${abbr}.json`
        )
        if (res.ok) tmp.push(await res.json() as StateFacilities)
      } catch { /* skip on error */ }
    }
    ;(globalThis as any).__cacheStates_geo = tmp
    states = tmp
  }

  /* ---- 2. flatten to Feature[] with rich attributes ------------------ */
  const features = states.flatMap(s =>
    s.counties.flatMap(c =>
      c.facilities.map((f: FacilityLite | any) => {
        /* lat/lon come from most recent submission record */
        const lat = parseFloat(f.sub_last?.lat_sub as unknown as string)
        const lon = parseFloat(f.sub_last?.lon_sub as unknown as string)
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

        /* submissions array exists only in the master JSON, not in state blobs.
           EPA’s pre-built state files include: subs, acc, prog_max, tox flag */
        const subsFile = f.subs        ?? 0
        const accFile  = f.acc         ?? 0
        const pFile    = f.prog_max    ?? null      // may be 0-3 or null
        const toxFile  = f.tox         ?? false

        /* If we do have full submissions, compute richer stats */
        const submissions = f.submissions ?? []
        const subsCalc = submissions.length || subsFile
        const accCalc  = submissions.reduce(
                           (a:any,s:any)=>a+(s.num_accidents??0), 0) || accFile
        const pCalc    = submissions.flatMap(
                           (s:any)=>s.processes?.map((p:any)=> {
                            console.log({p});
                            return (p.ProgramLevel ?? 0) || []
                           }))
                         .reduce((m,n)=>Math.max(m,n),0) || pFile || 0
        const toxCalc  = submissions.some(
                           (s:any)=>s.processes?.some((p:any)=>p.MH_ToxicRelease)) || toxFile

        /* Store pLevel as *string*; unique-value renderer keys are strings */
        const pLevelStr = String(pCalc)

        console.log("_______", pLevelStr, );
        

        return {
          type:'Feature',
          geometry:{ type:'Point', coordinates:[lon,lat] },
          properties:{
            id:   f.EPAFacilityID,
            name: f.name,
            city: f.city,
            state:s.abbr,
            lastDate: f.sub_last?.date_val,
            /* derived */
            subs : subsCalc,
            acc  : accCalc,
            pLevel: pCalc,       // "0".."3"
            toxRe: toxCalc
          }
        }
      })
    ).filter(Boolean)
  )

  /* ---- 3. return GeoJSON -------------------------------------------- */
  return { type:'FeatureCollection', features }
})