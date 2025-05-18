<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useFacilitiesStore } from '~/store/facilities.js'
import FacilitySection from '~/components/search/FacilitySection.vue'
import LocationSection from '~/components/search/LocationSection.vue'
import ProcessSection from '~/components/search/ProcessSection.vue'
import ResultsTable from '~/components/search/ResultsTable.vue'
import ArcFacilitiesMap from '~/components/ArcFacilitiesMap.vue'

/**
 * Entire filter object driving all sections
 */
const filters: any = reactive({
  // Facility
  facilityName: '',
  exactFacilityName: false,
  facilityId: '',
  parentCompany: '',
  exactParent: false,
  facilityDUNS: '',
  activeOnly: false,

  // Geographic Location
  address: '',
  exactAddress: false,
  city: '',
  state: '',
  county: '',
  zip: '',

  // Process
  chemicals: [] as string[],
  chemicalType: '',
  programLevel: '',
  naicsCodes: [] as string[]
})

const filtersModel = computed({
  get: () => filters,
  set: (newObj: Record<string, any>) => {
    // patch the existing `filters` rather than replace it
    Object.assign(filters, newObj)
  }
})


const store = useFacilitiesStore()

/** Reset every filter back to default */
function clearFilters() {
  Object.keys(filters).forEach(k => {
    const val = filters[k as keyof typeof filters]
    if (typeof val === 'boolean') filters[k as keyof typeof filters] = false as any
    else if (Array.isArray(val)) (filters[k as keyof typeof filters] as any) = []
    else filters[k as keyof typeof filters] = '' as any
  })
  runSearch()
}

/** Run the search API with exactly these filters */
function runSearch() {
  console.log({filters});
  
  store.search(filters as any)
}


function onFiltersUpdate(newPayload: Record<string, any>) {
  console.log('🟢 child emitted update:modelValue with:', newPayload)
  console.log('🟢 child emitted update:modelValue with:', filters)
  // if you want to merge it back into your reactive object:
  // Object.assign(filters, newPayload)
}
</script>

<template>
  <section class="usa-card usa-card--bordered">
    <header class="usa-card__header !px-0 ">
      <h1 class="usa-card__heading !text-3xl font-bold">Risk Management Plan</h1>
      <p class="!text-lg !font-normal">
        The Risk Management Plan (RMP) rule implements Section 112(r) of the 1990 Clean Air Act …
      </p>
    </header>
  
    <section>
    <!-- Accordion of filter sections -->
    <UsaAccordion bordered class="margin-bottom-2 usa-accordion--multiselectable">
      
      <UsaAccordionItem open id="facility">

        <template #title>Facility</template>
        <FacilitySection v-model="filtersModel"  @update:modelValue="onFiltersUpdate" />
      </UsaAccordionItem>

      <UsaAccordionItem id="location">
        <template #title>Geographic Location</template>
        <LocationSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
      </UsaAccordionItem>

      <UsaAccordionItem id="process">
        <template #title>Process</template>
        <ProcessSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
      </UsaAccordionItem>
    </UsaAccordion>

    </section>

    <section class="px-5 m-3">
    <!-- Clear + Search -->
    <div class="display-flex flex-justify-end gap-2">
      <button class="usa-button usa-button--outline" @click="clearFilters">
        Clear
      </button>
      <button class="usa-button" @click="runSearch">
        Search
      </button>
    </div>
  </section>
  
    <ArcFacilitiesMap :facilities="store.results" />
  
  <!-- Results -->
  <section class="margin-y-4 w-full h-500px overflow-x-hidden overflow-y-scroll">
    <ResultsTable :rows="store.results" />
  </section>
  </section>

</template>

<style scoped>
/* Page-specific tweaks, if needed */
</style>
