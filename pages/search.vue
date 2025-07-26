<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useFacilitiesStore, type FacilityLite } from '~/store/facilities.js'

import FacilitySection from '~/components/search/FacilitySection.vue'
import LocationSection from '~/components/search/LocationSection.vue'
import ProcessSection from '~/components/search/ProcessSection.vue'
import ResultsTable from '~/components/search/ResultsTable.vue'
import ArcFacilitiesMap from '~/components/ArcFacilitiesMap.vue'
import AccidentSection  from '~/components/search/AccidentSection.vue'

const filters: any = reactive({
  facilityName: '',
  exactFacilityName: false,
  facilityId: '',
  parentCompany: '',
  exactParent: false,
  facilityDUNS: '',
  activeOnly: false,
  address: '',
  exactAddress: false,
  city: '',
  state: '',
  county: '',
  zip: '',
  chemicals: [] as string[],
  chemicalType: '',
  programLevel: '',
  naicsCodes: [] as string[],
  hasAccidents:false,
  accFromDate :'',
  accToDate   :'',
  accFromTime :'',
  accToTime   :'',
  page: 1,
  perPage: 20,
})

const hasSearched = ref(false)

const filtersModel = computed({
  get: () => filters,
  set: (patch: any) => Object.assign(filters, patch),
})

const store = useFacilitiesStore()
// runSearch()

async function runSearch() {
  hasSearched.value = true
  await Promise.all([
    store.search(filters), // paginated
    store.fetchAll(filters), // full list for map
  ])
}

function exportExcel() {
  const params = new window.URLSearchParams(
    Object.entries(filters).reduce((acc, [key, value]) => {
      if (value == null) return acc;
      if (typeof value === 'boolean') {
        if (value) acc[key] = 'true';
        return acc;
      }
      if (Array.isArray(value)) {
        if (value.length) acc[key] = value.join(',');
        return acc;
      }
      if (value !== '') {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  );
  window.open(`/api/export?${params}`);
}

function clearFilters() {
  for (const k in filters) {
    const v = filters[k]
    filters[k] =
      typeof v === 'boolean'
        ? false
        : Array.isArray(v)
        ? []
        : ''
  }
  filters.page = 1
  runSearch()
}


function toggleShowAll() {
  store.toggleShowAll()  // Call the toggle function in the store
}



function onFiltersUpdate(p: any) {
  console.debug('update:modelValue', p)
}
</script>


<template>
  <div class="usa-card usa-card--bordered grid grid-cols-6 gap-4 items-start w-full h-fit mt-5">
    <section class="col-span-2">
      <header class="usa-card__header !px-0">
        <h1 class="usa-card__heading text-3xl font-bold">Risk Management Plan</h1>
        <p class="text-lg pt-1">The Risk Management Plan (RMP) rule implements Section&nbsp;112(r) of the 1990 Clean Air Act …</p>
        
        <p class="mb-4 ">
          <h5>
            <a href="https://www.data-liberation-project.org/" target="_blank">EPA Data Liberation Project</a>
          </h5>
          <div class="!text-sm">
            Data obtained: <span class="text-blue-900"><time datetime="2025-04-19">July 6, 2025 (EPA Dataset)</time></span>
            <br>
            Collaborators: <span class="text-blue-900">Drexel University RMP Data Liberation Project</span>
            <br>
            Contact: <a href="mailto:joel@drexel.edu" class="text-blue-900">Joel Doe (joel@drexel.edu)</a>
          </div>
        </p>
        <div class="mt-3">
            Enter one or more filter criteria (facility name, address, state, etc.), then click Search.  
            You can also download your filtered results as an Excel file.
        </div>
      </header>
      
      <!-- Map Column -->
      
      <div class="space-y-4">
        <UsaAccordion bordered class="margin-bottom-2 usa-accordion--multiselectable">
          <UsaAccordionItem ref="facility" label="Facility" open>
            <FacilitySection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
          
          <UsaAccordionItem  ref="Location" label="Location">
            <LocationSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
          
          <UsaAccordionItem ref="Process" label="Advanced">
            <span>Search by chemical name or NAICS code here.</span>
            <ProcessSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
          
          <UsaAccordionItem ref="Accidents" label="Accidents">
            <AccidentSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
        </UsaAccordion>
        
        <div class="flex justify-end gap-2">
          <div class="flex justify-end items-center">
          <button class="usa-button usa-button--outline w-fit" @click="toggleShowAll">
            {{ store.showAll ? 'Show Paginated Data' : 'Show All Data' }}
          </button>
          <button class="usa-button usa-button--outline" @click="clearFilters">New Search</button>
          <button class="usa-button" @click="runSearch">Search</button>
    </div>
          <!-- <button class="usa-button" @click="toggleFilterDrawer">Filters</button> -->
        </div>
      </div>
    </section>
      
  <!-- Results Section -->
  <section class="my-4 col-span-4 h-full overflow-x-hidden overflow-y-hidden space-y-3">
    <client-only>
    <ArcFacilitiesMap
    class="pb-5"
    :facilities="store.showAll ? store.allFacilities : store.results"
    :focus-ids="store.results.map((r: FacilityLite) => r.facilityId)"
    :show-all="store.showAll"  
    :has-searched="hasSearched"
    />
    </client-only>
  </section>

  <section class="col-span-6 p-1 m-1">
    <div v-if="!hasSearched" class="w-full h-full flex justify-center items-center m-2 bg-slate-200 rounded-lg p-3">
      Use the filters above and click “Search” to see results.
    </div>
    <div v-if="store.loading && hasSearched" class="flex flex-col w-full h-fit items-center justify-center space-y-2 p-5">
      <span class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></span>
      <span>Retrieving Facilities …</span>
    </div>

  <div v-if="hasSearched && !store.loading" class="h-fit">
    <!-- <button class="usa-button usa-button--secondary"
      @click="exportExcel">
        Download Excel
    </button> -->
      <ResultsTable
      :rows="store.results"
      :total="store.total"
      :page="store.page"
      :per-page="store.perPage"
      :hasSearched="hasSearched"
      @page-changed="store.goToPage"
    />
  </div>
  </section>

  </div>
</template>
