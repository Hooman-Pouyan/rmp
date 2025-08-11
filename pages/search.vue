<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useFacilitiesStore, type FacilityLite } from '~/store/facilities.js'

import FacilitySection from '~/components/search/FacilitySection.vue'
import LocationSection from '~/components/search/LocationSection.vue'
import ProcessSection from '~/components/search/ProcessSection.vue'
import ResultsTable from '~/components/search/ResultsTable.vue'
import ArcFacilitiesMap from '~/components/ArcFacilitiesMap.vue'
import AccidentSection  from '~/components/search/AccidentSection.vue'
import submissionSection  from '~/components/search/submissionSection.vue'
import { useFetch } from 'nuxt/app'


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
  submissionDate: null as string | null,
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
const totalAccidents = ref<number | null>(null)
const latestAccidents = ref<number | null>(null)

useFetch<{ totalAccidents:number; latestAccidents:number }>('/api/accidents/count')
  .then(({ data }) => {
    totalAccidents.value = data.value?.totalAccidents ?? null
    latestAccidents.value = data.value?.latestAccidents ?? null
  })

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
  <!-- About this Map (collapsible) -->
      <UsaAccordion bordered class="mt-4 mb-6">
        <UsaAccordionItem label="About this map">
          <p class="mb-2">
            Following the release of the new <b>Safer Communities by Chemical Accident Prevention (SCCAP)</b> rule finalized in 2024, the U.S. Environmental Protection Agency (EPA) released a public data tool to help the public understand the hazards associated with the most highly hazardous chemical plants across the United States. This information is <b>no longer available on EPA’s website</b>.
          </p>

          <p class="mb-2">
            This map was developed by The <strong>Environmental Collaboratory</strong> at Drexel University, in collaboration with the Environmental Justice Health Alliance for Chemical Policy Reform (EJHA), so that impacted communities <em>(residents, emergency responders, and local governments)</em> can still access facility information in their backyards. While the information displayed on this site was formatted by Drexel, the underlying data come from the U.S. EPA (see below), and neither Drexel nor EJHA make any claims about the accuracy or currency of the data.
          </p>

          <p class="mb-2">
            The information used on this map only includes publicly available and non‑confidential portions of Risk Management Plans submitted by chemical companies to the EPA as part of compliance with the Risk Management Program (RMP) under the Clean Air Act.
          </p>

          <p class="mb-2">
            This information was previously available on EPA’s website from <time datetime="2024-03-01">March 2024</time> to <time datetime="2025-04-18">April 18, 2025</time>. The underlying data for this project were obtained by the <a href="https://www.data-liberation-project.org/" target="_blank" class="text-blue-600 underline">Data Liberation Project</a> — see their <a href="https://www.data-liberation-project.org/methodology" target="_blank" class="text-blue-600 underline">methodology</a>.
          </p>

          <p class="mb-2">
            Since the RMP rule requires that facilities update their Risk Management Plans every five years, the data included here represent submissions received by <time datetime="2025-07-06">July 6, 2025</time>, and may not include incidents that occurred within the last five years.
          </p>

          <p>
            Questions? Contact <a href="mailto:joel@drexel.edu" class="text-blue-600 underline">Joel Doe</a>.
          </p>
        </UsaAccordionItem>
      </UsaAccordion>
  <div class="usa-card usa-card--bordered grid grid-cols-6 gap-4 items-start w-full h-fit">
    <section class="col-span-2">
      <header class="usa-card__header !px-0">
        <h1 class="usa-card__heading text-3xl font-bold">Risk Management Plan</h1>
        <p class="text-lg pt-1">The Risk Management Plan (RMP) rule implements Section&nbsp;112(r) of the 1990 Clean Air Act …</p>
        <!-- <p class="mb-4 ">
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
        </p> -->
        <div class="mt-3">
            Enter one or more filter criteria (facility name, address, state, etc.), then click Search.  
            You can also download your filtered results as an Excel file.
        </div>
      </header>
      
      <!-- Map Column -->
      
      <div class="space-y-4">
        <UsaAccordion bordered class="margin-bottom-2 usa-accordion--multiselectable">
          <UsaAccordionItem  ref="Location" label="Location">
            <LocationSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
          <UsaAccordionItem ref="facility" label="Facility" open>
            <FacilitySection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
          <UsaAccordionItem ref="Process" label="Advanced">
            <span>Search by chemical name or NAICS code here.</span>
            <ProcessSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
          <UsaAccordionItem ref="Accidents" label="Accidents">
            <AccidentSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem>
          <!-- <UsaAccordionItem ref="Submissions" label="Submissions">
            <submissionSection v-model="filtersModel" @update:modelValue="onFiltersUpdate" />
          </UsaAccordionItem> -->
        </UsaAccordion>
        
        <div class="flex justify-end gap-2">
          <div class="flex justify-end items-center">
          <button class="usa-button usa-button--outline w-fit" @click="toggleShowAll">
            {{ store.showAll ? 'Show Paginated Data' : 'Show All Data' }}
          </button>
          <button class="usa-button usa-button--outline" @click="clearFilters">Clear All Filters</button>
          <button class="usa-button" @click="runSearch">Search</button>
    </div>
          <!-- <button class="usa-button" @click="toggleFilterDrawer">Filters</button> -->
        </div>
      </div>
    </section>
      
  <!-- Results Section -->
  <section class="my-4 col-span-4 h-full overflow-x-hidden overflow-y-hidden space-y-3">
    <div v-if="totalAccidents !== null && latestAccidents !== null" class="font-semibold text-lg pb-2">
      Accidents on record: {{ totalAccidents.toLocaleString() }}
      <span class="text-gray-600"> (last 5 years: {{ latestAccidents.toLocaleString() }})</span>
    </div>
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
    <div v-if="!store.loading && hasSearched && !store.results.length" class="flex flex-col w-full h-fit items-center justify-center space-y-2 p-5">
      <span>No Result Found</span>
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
