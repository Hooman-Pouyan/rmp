import { defineStore } from "pinia";
import { useFetch } from "#app";
import { buildQuery } from "~/core/utils/buildQuery";
import type { FacilityLite } from "~/core/types/facility";

export const useFacilitiesStore = defineStore("facilities", {
  state: () => ({
    results: [] as FacilityLite[],
    total: 0,
    loading: false,
  }),
  actions: {
    async search(filters: Record<string, any>) {

      console.log(filters);
      
      this.loading = true;
      this.results = [];
      this.total = 0;

      try {
        const qs = buildQuery(filters);
        const url = qs ? `/api/search?${qs}` : "/api/search";

        const { data, error } = await useFetch<{
          facilities: FacilityLite[];
          total: number;
        }>(url);
        if (error.value) throw error.value;

        this.results = data.value?.facilities || [];
        this.total = data.value?.total || this.results.length;
      } catch (err) {
        console.error("[FacilitiesStore] search failed:", err);
      } finally {
        this.loading = false;
      }
    },
  },
});
