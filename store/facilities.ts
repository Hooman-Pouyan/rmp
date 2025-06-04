import { defineStore } from 'pinia'
import { useFetch }    from '#app'

/* ---- types that mirror API responses ---------------------------------- */
export interface FacilityLite {
  EPAFacilityID: string
  name: string
  city: string
  state: { name:string; abbr:string }
  zip: string
  address?:    string
  company_1?:  string
  company_2?:  string
  county_fips?:string
  sub_last?: {
    id?: string
    date_val?: string
    date_dereg?: string
    lat_sub?: number
    lon_sub?: number
    num_accidents?: number
    latest_accident?: string
  }
}
interface SearchResponse {
  total: number
  page: number
  perPage: number
  facilities: FacilityLite[]
}

/* ---- store ------------------------------------------------------------ */
export const useFacilitiesStore = defineStore('fac', {
  state: () => ({
    /* paginated list for ResultsTable */
    results : [] as FacilityLite[],
    total   : 0,
    page    : 1,
    perPage : 20,

    /* complete list for the map */
    allFacilities: [] as FacilityLite[],

    /* last filter payload */
    filters : {} as Record<string,any>,
    loading : true
  }),

  actions:{
    /* internal helper */
    _qs(obj:Record<string,any>){
      const qs = new URLSearchParams()
      for (const [k,v] of Object.entries(obj)){
        if (v==null || v==='' || (Array.isArray(v)&&!v.length)) continue
        if (Array.isArray(v)) v.forEach(x=>qs.append(k,String(x)))
        else qs.append(k,String(v))
      }
      return qs.toString()
    },

    /* paginated fetch for table */
    async search(filters:Record<string,any>){
      this.loading = true
      this.filters = { ...filters }

      const url = `/api/search?${this._qs(filters)}`
      const { data,error } = await useFetch<SearchResponse>(url)
      if (error.value) console.error('search error',error.value)
      else if (data.value){
        this.results = data.value.facilities
        this.total   = data.value.total
        this.page    = data.value.page
        this.perPage = data.value.perPage
      }
      this.loading = false
    },

    /* full dataset for the map */
    async fetchAll(filters:Record<string,any>){
      const allQ = { ...filters, page:1, perPage:'0' }
      const url  = `/api/search?${this._qs(allQ)}`
      const { data,error } = await useFetch<SearchResponse>(url)
      if (error.value) console.error('fetchAll error',error.value)
      else if (data.value) this.allFacilities = data.value.facilities
    },

    async goToPage(newPage:number){
      this.filters.page = newPage
      await this.search(this.filters)
    }
  }
})