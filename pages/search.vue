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
    <h3>What is the Risk Management Program (RMP)?</h3>
    <p>
      The Risk Management Program (RMP), administered by the U.S. Environmental Protection Agency (EPA) under Section
      112(r) of the Clean Air Act, is intended to prevent disasters and releases at high-risk chemical facilities by establishing
      response and prevention programs. It was enacted by Congress in 1990 following the 1984 pesticide gas disaster that
      has since injured or killed over a half million people in Bhopal, India to prevent similar incidents from occurring in the
      United States.
    </p>
    <p>
      The EPA 2024 RMP rule requires that high-risk chemical facilities develop a plan to 1) assess the potential effects of a
      chemical incident, 2) identify steps the facility is taking to prevent an incident, and 3) identify emergency response
      procedures should an incident occur. Facilities have to submit updated RMP plans to the EPA at least every five years
      and report any incidents that have occurred since their last plan.
    </p>
    <p>
      The RMP rule regulates around 12,000 high-risk facilities that manufacture, use and stockpile highly hazardous
      chemicals such as those used in oil refineries, chemical plants, paper mills, food processing, water treatment,
      agriculture (pesticides, fertilizers and the intermediary chemicals used to make the final product), plastics and other
      products. Fenceline communities neighboring these facilities are disproportionately Black, Latino and low-income and
      are impacted not only by chemical emissions from these facilities, but also many non-chemical stressors (such as
      socioeconomic factors) and ongoing chemical disasters from these facilities.
    </p>
    <p>For more information, see “Where does the database come from?” by the <a href="https://www.data-liberation-project.org/" target="_blank" class="text-blue-600 underline">Data Liberation Project</a>.</p>

    <h3>Which facilities or processes are regulated under the RMP rule?</h3>
    <p>
      If a facility includes a process unit that makes, uses or stores a certain amount of a regulated substance/chemical (see
      <a href="https://www.epa.gov/rmp/list-regulated-substances-under-risk-management-program" target="_blank" class="text-blue-600 underline">here</a>), that process is subject to complying with the RMP rule.
      To be clear, the entire facility is not regulated under the RMP, only the processes that meet the chemical and quantity
      thresholds.
    </p>

    <h3>What does it mean to be an RMP facility for the purposes of this tool?</h3>
    <p>
      A facility is listed as an RMP facility on this map if it submitted a Risk Management Plan to the EPA before April 3,
      2025 in compliance with the RMP rule since the RMP was established in 1990.
    </p>


    <p>The information in this section is drawn from “What’s in the database?” by the Data Liberation Project, an organization that requests RMP data from the federal government periodically and posts it for public access.</p>
    <p>The best way to understand what’s in the database is to read the EPA’s user guide for facilities submitting RMPs. It walks through each section, field, and value, and will give you a sense of what the data-entry process looks like. The database is oriented around the concept of the RMP submission. Here’s a broad overview of what an RMP submission contains, going section by section:</p>
    <h3>What information is included on a facility’s RMP submission?</h3>
    <p><strong>Section 1. Registration:</strong> This section provides general information about the facility and the submission itself, including the type of submission, facility name, parent company names (majority owner or two largest owners),  EPA Facility ID, other EPA identifiers, DUNS numbers, facility address, facility geocoordinates, person responsible for RMP implementation, emergency contact,  Local Emergency Planning Committee, number of full-time equivalent employees on site, applicability of other federal safety rules, last safety inspection date/inspector, whether using “predictive filing,” and a list of relevant “processes” (see definition below).</p>

    <p><strong>Section 2: Toxics: Worst-Case:</strong> This section contains the facility’s assessment of the “worst-case release scenario” for Program 1 processes (see “program” definition below), another for toxic substances in Programs 2 and 3, another for flammable substances in Programs 2 and 3, and potentially additional scenarios depending on the range of potential “public receptors” (see the user guide and/or statute for details). This section focuses on toxic substances. For each scenario, facilities list the process, chemical, chemical state (e.g., gas, liquid), scenario model used, release rate, and a handful of scenario-modeling factors. The EPA has redacted or fully zeroed-out much of the other information in this section, however, including: type of scenario, quantity of chemical released, release duration, distance to “endpoint,” residential population within distance to endpoint, and “public receptors” (e.g., schools, homes, hospitals) and “environmental receptors” (e.g., state parks, wildlife sanctuaries) within distance to endpoint.</p>

    <p><strong>Section 3: Toxics: Alternative Release:</strong> Alternative release scenarios are those more likely to occur than the “worst-case” scenarios but could still affect the public. Facilities must “present one alternative release scenario for each regulated toxic substance held above the threshold quantity in a Program 2 or 3 process [and] one alternative release scenario to represent all flammable substances held above the threshold quantity in a Program 2 or 3 process.” This section focuses on toxic substances. The information provided by facilities (and EPA redactions) are similar to those in the section above. Also similarly, they are heavily redacted.</p>

    <p><strong>Section 4: Flammables: Worst-Case:</strong> Similar to Section 2, but for flammable substances, with slight differences. Also similarly, they are heavily redacted.</p>

    <p><strong>Section 5: Flammables: Alternative Release:</strong> Similar to Section 3, but for flammable substances, with slight differences. Also similarly, they are heavily redacted.</p>

    <p><strong>Section 6: Five-Year Accident History:</strong> The accident histories listed in the RMPs must include ”all accidental releases from covered processes that resulted in deaths, injuries, or significant property damage on site, or known offsite deaths, injuries, evacuations, sheltering in place, property damage, or environmental damage.” For each such accident in the five years before the RMP submission, this section includes: the date and time the accident began, the duration of the release, the NAICS industry code of the process involved, the chemicals involved, the type of accident (explosion, fire, etc.), source of release, weather conditions, initiating event type, contributing factors, on-site impacts (deaths, injuries, property damage), known offsite impacts, whether offsite responders were notified, changes implemented as a result of the accident, and whether the facility is withholding any aspect as confidential business information.</p>

    <p><strong>Section 7: Prevention Program: Program Level 3:</strong> For each Program 3 process (see “program” definition below), and, in some cases, individual units of each process, facilities must provide a variety of information about the steps they’ve taken to prevent accidents, including: the NAICS industrial code for the process, the chemicals involved, the date the safety information was last reviewed, the date and technique of the last “Process Hazard Analysis,” the major hazards identified (e.g., explosion, corrosion, overfilling, earthquakes, hurricanes), process controls in place (e.g., relief valves, keyed bypass systems, automatic shutoffs), mitigation systems in use (e.g., sprinkler systems, blast walls), monitoring systems in use, training programs provided, recent maintenance, recent audits, recent incident investigations, and other compliance-related information.</p>

    <p><strong>Section 8: Prevention Program: Program Level 2:</strong> Similar to Section 7, but for Program 2 processes, with slight differences.</p>

    <p><strong>Section 9: Emergency Response:</strong> In this section, facilities provide information about their emergency response plan, mostly in the form of yes/no checkboxes, with the exception of the dates of the most recent emergency response update and training for employees, as well as the name and phone number of the “local agency with which your facility's ER plan or response actions are coordinated.” Facilities that (in addition to meeting other criteria) do not have their employees respond to emergencies are not required to complete this section.</p>

    <h3>Executive Summary</h3>
    <p>This is a single, free-text field. As the submission guide explains: “The Executive Summary must include a brief description of your facility's risk management program. You determine the length; it may be as short as two or three pages or, if you have many processes, it may need to be longer. You should view the Executive Summary as an opportunity to communicate in your own words the nature of the risks posed by your facility to your community and to explain what you have done to minimize those risks.“</p>

    <h3>Additional Resources</h3>
    <ul class="list-disc ml-6">
      <li><a href="https://www.epa.gov/rmp/list-regulated-substances-under-risk-management-program" target="_blank" class="text-blue-600 underline">EPA’s List of Chemicals and Threshold Quantities</a></li>
      <li><a href="https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit?tab=t.0" target="_blank" class="text-blue-600 underline">Data Liberation Project: EPA RMP Database Documentation</a></li>
      <li><a href="https://preventchemicaldisasters.org/chemical-incident-tracker/incidents" target="_blank" class="text-blue-600 underline">Coalition to Prevent Chemical Disasters Incident Tracker</a></li>
      <li><a href="https://preventchemicaldisasters.org/" target="_blank" class="text-blue-600 underline">Coalition to Prevent Chemical Disasters Website</a></li>
      <li><a href="https://www.data-liberation-project.org/" target="_blank" class="text-blue-600 underline">Data Liberation Project Website</a></li>
    </ul>
      <p class="mt-4">
      If you’d like to learn more about the context, background, and methodologies used to collect, organize, and publish this data,
      please review the original RMP eSubmit User Manual and additional links provided by the Data Liberation Project. These
      contain deeper insights into the federal data submission process and data transparency efforts.
    </p>
  </UsaAccordionItem>
  <UsaAccordionItem label="User Guide">
    <h3>How to use this search tool & map</h3>
    <p>
      For many years, residents and workers have called for an accessible way to search for RMP facility information online.
      Previously, there were few options to see these data. Accessing even basic information about facilities located near
      your home or job was extremely onerous and outdated. In February 2024, EPA finalized much needed updates to the
      RMP in the “Safer Communities by Chemical Accident Prevention” rule and at the same time, released an RMP search
      tool that allowed users to easily search for and find information about RMP facilities in their states and communities.
      Then in April 2025, EPA took that search tool offline after the chemical industry called for it to be taken down. In the
      absence of EPA’s tool, Drexel University developed this search tool and map to ensure that communities and facility
      workers still have access to this information.
    </p>
    <p>Some ways to use this tool include:</p>
    <ul class="list-disc ml-6">
      <li>Typing in your home or work address and/or zooming into your area on the map to see what facilities are in your area to better inform and protect yourself and your family in the event of a chemical disaster.</li>
      <li>Searching by your city or county name to see what facilities are in your area and what kinds of hazards they pose, and reaching out to your local government or Local Emergency Planning Committee to ask what emergency prevention or response plans are in place and what you should do in a disaster.</li>
      <li>Searching by a specific name of a facility that you work in or live near and have concerns about.</li>
      <li>Searching (in the “advanced search”) by chemical name (see “In advanced search – What does it mean to search by a specific chemical? Are the results that come up comprehensive?“ below for details).</li>
      <li>Looking at the map to see the frequency of chemical disasters in a given area and clicking on specific incidents to find more information about them.</li>
    </ul>

    <h3>How does this tool differ from EPA’s former tool?</h3>
    <p>
      This tool includes access to the same information contained in EPA’s previous tool. You can use this tool in the same
      way you would have used EPA’s, however this tool will not be updated as frequently. Chemical facilities can revise or
      update their RMP plans at any time. EPA’s tool was updated daily, but this one will be updated annually.
    </p>

    <h3>What is considered a “recent accident” for the purpose of this search tool and map?</h3>
    <p><em>(Note: Communities and chemical safety advocates refer to these as “incidents” because “accidents” cannot be prevented, and chemical disaster incidents are preventable.)</em></p>

    <p>A “recent accident” is an incident such as an explosion, leak, or other chemical release that was reported by a facility on their last RMP submission to the EPA. Facilities are required by the EPA to submit an updated RMP at least every five years, starting the date when a facility begins to use, make or store a regulated chemical above a threshold amount. Due to the periodic nature of RMP submissions, there is a delay in reporting incidents to EPA and therefore incident data for the past five years is incomplete.</p>

    <p>Facilities are only required to report an incident to the EPA (i.e. “reportable incident”) if it involved one or more RMP regulated chemicals that were emitted at levels above the threshold quantity (noted here). The incident must have also involved deaths, injuries, property damage or resulted in environmental damage, evacuation or sheltering in place. <strong>*Note: The data underlying this map only contains records through April 3, 2025.</strong></p>

    <p>An exception for the requirement to submit an RMP every five years is if a facility makes substantial changes to an RMP covered process. If substantial changes are made to an RMP covered process within the five-year compliance period, a facility can submit an updated RMP more frequently.</p>

    <h4 class="mt-4 font-semibold">For example:</h4>

    <p><strong>Facility 1:</strong> A facility may not have contained a chemical at the amount that triggers compliance with the RMP until March 1, 2008. It would be required to file an RMP five years on March 1 after that, in 2013, 2018, 2023 and 2028. The data underlying this map only contains records through April 3, 2025. So if the facility complied with the RMP and reported on time, the most recent submission would include incidents from March 2, 2018 through March 1, 2023.</p>

    <p><strong>Facility 2:</strong> A different facility may have been required to comply with the rule as of April 30, 2000, which would mean they were required to submit their RMP plan to EPA at least every five years by April 30th after that, in 2005, 2010, 2015, 2020, 2025. The most recent submission on this map would include incidents from May 1, 2015–April 30, 2020 since the data underlying this map only contains records through April 3, 2025.</p>

    <p><a href="https://www.whatsinmyair.org/data-liberation-project/rmp/what-counts-as-an-accident" target="_blank" rel="noopener noreferrer">What makes an incident reportable can be found here.</a><br>
    You can also read <a href="https://www.whatsinmyair.org/data-liberation-project/rmp/what-counts-as-an-accident" target="_blank" rel="noopener noreferrer">“What counts as an accident?” by Data Liberation Project</a> for more information.</p>

  <h3>In the advanced search feature – What does it mean to search by a specific chemical? Are the results comprehensive?</h3>
    <p><strong>No, the results are NOT comprehensive.</strong></p>
    <p>
      Just because a facility doesn’t show up when you search by chemical does not mean that the facility does not use, make, or store
      that chemical. It just means they are not regulated under the RMP for that chemical. The facility could still use or store the
      chemical at a lower amount than the RMP threshold.
    </p>
    <p>
      When viewing a facility’s details, the chemicals listed are only those regulated under the RMP. Not all chemicals are regulated,
      and even regulated ones might not appear if the facility doesn’t exceed the reporting threshold.
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
