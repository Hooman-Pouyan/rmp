import { defineStore } from 'pinia'
import { useFetch }    from '#app'

/* ---- types that mirror API responses ---------------------------------- */
export interface FacilityLite {
  facilityId: string;
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  facilityURL: string | null;
  facilityLat: string;
  facilityLong: string;
  parentCompanyName: string | null;
  facilityDUNS: number | null;
  operatorName: string;
  noAccidents: string;
  programLevel: number;

  accidents: Array<{
    accidentHistoryId: number;
    accidentDate: string;
    accidentTime: string;
    // Add more fields if needed later
  }> | null;

  submissions: Array<{
    submissionId: number;
    chemicals: Array<{
      chemicalId: number;
      quantity: number;
      chemicalName: string;
    }>;
    naicsCode: string[];
  }>;
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
    results : [] as FacilityLite[] | any,
    total   : 0,
    page    : 1,
    perPage : 20,

    /* complete list for the map */
    allFacilities: [] as FacilityLite[] | any,

    /* last filter payload */
    filters : {} as Record<string,any>,
    showAll: false, // <-- Add this line
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

    async toggleShowAll () {
        this.showAll = !this.showAll
        /* first time user turns “Show All” on → make sure we have the full list */
        if (this.showAll && !this.allFacilities.length){
          await this.fetchAll(this.filters)
      }
    },

    async goToPage(newPage:number){
      this.filters.page = newPage
      await this.search(this.filters)
    }
  }
})