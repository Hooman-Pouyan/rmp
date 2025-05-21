import { defineStore } from "pinia";
import { useFetch } from "#app";

// exactly what your API returns
interface SearchResponse {
  total: number;
  page: number;
  perPage: number;
  facilities: FacilityLite[];
}

export interface FacilityLite {
  EPAFacilityID: string;
  name: string;
  city: string;
  state: { name: string; abbr: string };
  zip: string;
  address?: string;
  company_1?: string;
  company_2?: string;
  county_fips?: string;
  sub_last?: {
    id?: string;
    date_val?: string;
    date_dereg?: string;
    lat_sub?: number;
    lon_sub?: number;
    num_accidents?: number;
    latest_accident?: string;
  };
}

export const useFacilitiesStore = defineStore("fac", {
  state: () => ({
    // the array your table & map read from
    results: [] as FacilityLite[],

    // pagination metadata
    total: 0,
    page: 1,
    perPage: 10,

    // to remember what filters we last used
    filters: {} as Record<string, any>,

    loading: false,
  }),

  actions: {
    /**
     * Run the API search with whatever filters.page and .perPage are set to.
     * Stores the last filters, and sets total/page/perPage/results.
     */
    async search(filters: Record<string, any>) {
      this.loading = true;
      this.filters = { ...filters };

      // build query string
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0))
          continue;
        if (Array.isArray(v)) {
          v.forEach((x) => qs.append(k, String(x)));
        } else {
          qs.append(k, String(v));
        }
      }

      try {
        const { data, error } = await useFetch<SearchResponse>(
          `/api/search?${qs.toString()}`
        );
        if (error.value) {
          console.error("Search API error", error.value);
        } else if (data.value) {
          this.results = data.value.facilities;
          this.total = data.value.total;
          this.page = data.value.page;
          this.perPage = data.value.perPage;
        }
      } catch (err) {
        console.error("Unexpected search error", err);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Jump to a new page using the same filters you last ran.
     */
    async goToPage(newPage: number) {
      // mutate the page on your copy of filters
      this.filters.page = newPage;
      await this.search(this.filters);
    },
  },
});
