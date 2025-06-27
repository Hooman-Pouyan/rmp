<template>
  <section class="usa-section">
    <!-- Loading / Error States -->
    <div v-if="loading" class="usa-prose h-[250px]">
      <div className="w-full h-full flex justify-center items-center">
        <span className="animate-spin rounded-full flex justify-center items-center h-16 w-16 border-t-4 border-blue-500"></span>
      </div>
    </div>

    <div v-else-if="error" class="usa-prose">
      <div class="usa-alert usa-alert--error">
        <div class="usa-alert__body">{{ error }}</div>
      </div>
    </div>

    <!-- Facility Detail -->
    <div v-else>
      <!-- Facility Header Card -->
      <div class="usa-card usa-card--bordered margin-bottom-4">
        <header class="usa-card__header">
          <h1 class="usa-card__heading">{{ facility?.name }}</h1>
        </header>

        <div class="usa-card__body grid-row grid-gap">
          <!-- Left column: Basic Info -->
          <div class="tablet:grid-col-6">
            <dl class="usa-identifier-list">
              <div class="usa-identifier-list__item">
                <dt class="usa-identifier-list__label">EPA Facility ID</dt>
                <dd class="usa-identifier-list__value">{{ facility?.EPAFacilityID }}</dd>
              </div>
              <div class="usa-identifier-list__item">
                <dt class="usa-identifier-list__label">Address</dt>
                <dd class="usa-identifier-list__value">{{ facility?.address }}</dd>
              </div>
              <div class="usa-identifier-list__item">
                <dt class="usa-identifier-list__label">City</dt>
                <dd class="usa-identifier-list__value">{{ facility?.city }}</dd>
              </div>
              <div class="usa-identifier-list__item">
                <dt class="usa-identifier-list__label">State</dt>
                <dd class="usa-identifier-list__value">{{ facility?.state }}</dd>
              </div>
              <div class="usa-identifier-list__item">
                <dt class="usa-identifier-list__label">ZIP Code</dt>
                <dd class="usa-identifier-list__value">{{ facility?.zip }}</dd>
              </div>
              <div class="usa-identifier-list__item" v-if="facility?.county_fips">
                <dt class="usa-identifier-list__label">County FIPS</dt>
                <dd class="usa-identifier-list__value">{{ facility?.county_fips }}</dd>
              </div>
            </dl>
          </div>

          <!-- Right column: Company / Operator -->
          <div class="tablet:grid-col-6">
            <dl class="usa-identifier-list">
              <div class="usa-identifier-list__item" v-if="facility?.company_1">
                <dt class="usa-identifier-list__label">Company 1</dt>
                <dd class="usa-identifier-list__value">{{ facility?.company_1 }}</dd>
              </div>
              <div class="usa-identifier-list__item" v-if="facility?.company_2">
                <dt class="usa-identifier-list__label">Company 2</dt>
                <dd class="usa-identifier-list__value">{{ facility?.company_2 }}</dd>
              </div>
              <div class="usa-identifier-list__item" v-if="facility?.operator">
                <dt class="usa-identifier-list__label">Operator</dt>
                <dd class="usa-identifier-list__value">{{ facility?.operator }}</dd>
              </div>
              <div class="usa-identifier-list__item" v-if="mostRecentSubmission">
                <dt class="usa-identifier-list__label">Last Validated</dt>
                <dd class="usa-identifier-list__value">{{ mostRecentSubmission.date_val }}</dd>
              </div>
              <div
                class="usa-identifier-list__item"
                v-if="mostRecentSubmission && mostRecentSubmission.date_dereg"
              >
                <dt class="usa-identifier-list__label">Deregistered On</dt>
                <dd class="usa-identifier-list__value">{{ mostRecentSubmission.date_dereg }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- Submissions Table -->
      <div class="usa-prose">
        <h2>RMP Submissions</h2>
        <table class="usa-table usa-table--striped usa-table--borderless usa-table--full">
          <thead class="usa-table__head">
            <tr class="usa-table__row">
              <th class="usa-table__header">Submission #</th>
              <th class="usa-table__header">Received Date</th>
              <th class="usa-table__header">Validated Date</th>
              <th class="usa-table__header">Deregistered Date</th>
              <th class="usa-table__header"># Accidents</th>
              <th class="usa-table__header">Facility Name</th>
            </tr>
          </thead>

          <tbody class="usa-table__body">
            <tr
              v-for="sub in sortedSubmissions"
              :key="sub.id"
              class="usa-table__row"
            >
              <td class="usa-table__cell">
                <NuxtLink :to="`/submission/${sub.id}`">#{{ sub.id }}</NuxtLink>
              </td>
              <td class="usa-table__cell">{{ sub.date_rec }}</td>
              <td class="usa-table__cell">{{ sub.date_val }}</td>
              <td class="usa-table__cell">{{ sub.date_dereg || '—' }}</td>
              <td class="usa-table__cell">{{ sub.num_accidents ?? '0' }}</td>
              <td class="usa-table__cell">{{ sub.name }}</td>
            </tr>

            <tr v-if="!facility?.submissions.length">
              <td colspan="6" class="usa-table__cell text-center">No submissions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed }   from 'vue'
import { useFetch }   from '#app'

/* —————————————————— Type helpers (unchanged) —————————————————— */
interface SubmissionSummary {
  id: number
  date_rec: string
  date_val: string
  date_dereg: string | null
  lat_sub: string
  lon_sub: string
  num_accidents: number | null
  latest_accident: string | null
  name: string
  company_1: string
  company_2: string
  operator: string
}

interface FacilityDetail {
  EPAFacilityID: string
  name: string
  state: string
  city: string
  ValidationDate: string
  address: string
  zip: string
  county_fips?: string
  company_1?: string
  company_2?: string
  operator?: string
  submissions: SubmissionSummary[]
  accidents: any[]
  names_prev: string[]
}

/* —————————————————— Reactive route param —————————————————— */
const route      = useRoute()
const facilityId = computed(() => route.params.id as string)

/* —————————————————— SSR-aware fetch —————————————————— */
const {
  data: facility,
  pending: loading,
  error
} = await useFetch<FacilityDetail>(
  () => `/api/facilities/${facilityId.value}`,
  { key: () => `facility-${facilityId.value}` }
)

/* —————————————————— Derived data —————————————————— */
const sortedSubmissions = computed(() =>
  facility.value
    ? [...facility.value.submissions].sort((a, b) =>
        b.date_val.localeCompare(a.date_val))
    : []
)

const mostRecentSubmission = computed(() =>
  sortedSubmissions.value[0] ?? null
)
</script>

<style scoped>
.margin-bottom-4 { margin-bottom: 2rem; }
.usa-identifier-list__label { font-weight: 600; margin-bottom: 0.25rem; }
.usa-identifier-list__value { margin-bottom: 0.75rem; }
</style>