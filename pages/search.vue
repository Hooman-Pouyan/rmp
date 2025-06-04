<script setup lang="ts">
import { reactive, computed }  from 'vue'
import { useFacilitiesStore }  from '~/store/facilities.js'

import FacilitySection  from '~/components/search/FacilitySection.vue'
import LocationSection  from '~/components/search/LocationSection.vue'
import ProcessSection   from '~/components/search/ProcessSection.vue'
import ResultsTable     from '~/components/search/ResultsTable.vue'
import ArcFacilitiesMap from '~/components/ArcFacilitiesMap.vue'

/* master filter object */
const filters:any = reactive({
  facilityName:'', exactFacilityName:false,
  facilityId:'',   parentCompany:'',   exactParent:false,
  facilityDUNS:'', activeOnly:false,

  address:'', exactAddress:false, city:'', state:'', county:'', zip:'',

  chemicals:[] as string[], chemicalType:'', programLevel:'', naicsCodes:[] as string[],

  page:1, perPage:20
})

/* bind child sections */
const filtersModel = computed({
  get:()=>filters,
  set:(patch:any)=>Object.assign(filters,patch)
})

const store = useFacilitiesStore()
runSearch()

async function runSearch(){
  await Promise.all([
    store.search  (filters),          // paginated
    store.fetchAll(filters)           // full list for map
  ])
}

function clearFilters(){
  for (const k in filters){
    const v = filters[k]
    filters[k] = typeof v==='boolean'? false
               : Array.isArray(v)    ? []
               : ''
  }
  filters.page = 1
  runSearch()
}

function onFiltersUpdate(p:any){
  console.debug('update:modelValue',p)
}
</script>

<template>
  <section class="usa-card usa-card--bordered grid grid-cols-2 gap-3 items-start w-full h-fit py-2 px-3">
    <!-- filters / heading column -->
    <div class="space-y-4">
      <header class="usa-card__header !px-0">
        <h1 class="usa-card__heading text-3xl font-bold">Risk Management Plan</h1>
        <p class="text-lg">The Risk Management Plan (RMP) rule implements Section&nbsp;112(r) of the 1990 Clean Air Act …</p>
      </header>

      <!-- accordion -->
      <UsaAccordion bordered class="margin-bottom-2 usa-accordion--multiselectable">
        <UsaAccordionItem open id="facility">
          <template #title>Facility</template>
          <FacilitySection v-model="filtersModel" @update:modelValue="onFiltersUpdate"/>
        </UsaAccordionItem>

        <UsaAccordionItem id="location">
          <template #title>Geographic Location</template>
          <LocationSection v-model="filtersModel" @update:modelValue="onFiltersUpdate"/>
        </UsaAccordionItem>

        <UsaAccordionItem id="process">
          <template #title>Process</template>
          <ProcessSection v-model="filtersModel" @update:modelValue="onFiltersUpdate"/>
        </UsaAccordionItem>
      </UsaAccordion>

      <!-- buttons -->
      <div class="flex justify-end gap-2">
        <button class="usa-button usa-button--outline" @click="clearFilters">Clear</button>
        <button class="usa-button"                    @click="runSearch">Search</button>
      </div>
    </div>

    <!-- map column -->
    <ArcFacilitiesMap
      :facilities="store.allFacilities"
      :focus-ids="store.results.map(r=>r.EPAFacilityID)"
    />
  </section>

  <!-- results -->
  <section class="my-4 w-full h-[500px] overflow-x-hidden overflow-y-scroll">
    <div v-if="store.loading" class="flex flex-col items-center justify-center h-full space-y-2">
      <span class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></span>
      <span>Retrieving Facilities …</span>
    </div>

    <div v-else>
      <ResultsTable
        :rows="store.results"
        :total="store.total"
        :page="store.page"
        :per-page="store.perPage"
        @page-changed="store.goToPage"
      />
    </div>
  </section>
</template>

<style scoped>
/* tweak styles here if needed */
</style>