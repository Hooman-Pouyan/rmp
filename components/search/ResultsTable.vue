<script setup lang="ts">
import { computed } from 'vue'
import type { FacilityLite } from '~/core/types/facility'

const props = defineProps<{
  rows: FacilityLite[]
  total: number
  page: number
  perPage: number
  hasSearched: boolean
}>()

const emit = defineEmits<{
  (e: 'page-changed', newPage: number): void
}>()

// pagination
const totalPages = computed(() => Math.ceil(props.total / props.perPage))
const windowSize = 5
const visiblePages = computed(() => {
  const tp = totalPages.value
  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, props.page - half)
  let end   = Math.min(tp, props.page + half)
  if (props.page <= half) start = 1, end = Math.min(tp, windowSize)
  if (props.page + half > tp) start = Math.max(1, tp - windowSize + 1), end = tp
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function goto(p: number) {
  if (p >= 1 && p <= totalPages.value && p !== props.page) {
    emit('page-changed', p)
  }
}

// export CSV
function exportCSV() {
  if (!props.rows.length) return
  const header = ['EPA ID','Facility','State','City','Parent','# Recent Accidents', "Submissions", "# All‐time Accidents"]
  const lines = props.rows.map(r => [
    r.facilityId,
    `"${r.facilityName.replace(/"/g,'""')}"`,
    r.state,
    r.city,
    `"${(r.parentCompanyName||'').replace(/"/g,'""')}"`,
    r.accidents?.length||0
  ].join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'facilities_export.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>

  <div v-if="rows.length">
    <div class="flex justify-end mb-2">
      <button class="usa-button usa-button--outline" @click="exportCSV">
        Export CSV
      </button>
    </div>

    <table class="usa-table usa-table--striped w-full">
      <thead>
        <tr>
          <th>EPA ID</th><th>Facility</th><th>State</th><th>City</th>
          <th>Parent Company</th><th>Last Validated</th><th>Accidents</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.facilityId">
          <td>{{ r.facilityId }}</td>
          <td>
            <NuxtLink :to="`/facility/${r.facilityId}`">{{ r.facilityName }}</NuxtLink>
          </td>
          <td>{{ r.state }}</td>
          <td>{{ r.city }}</td>
          <td>{{ r.parentCompanyName || '—' }}</td>
          <td>—</td>
          <td>{{ r.accidents?.length ?? 0 }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- <p v-else class="usa-prose text-center">
    Use the filters above and click “Search” to see facilities.
  </p> -->

<nav class="!no-underline w-full flex justify-center" v-if="totalPages > 1">
    <ul class="w-fit flex justify-center">
      <!-- previous arrow -->
      <li class="usa-pagination__item usa-pagination__item--arrow ">
        <button
          class="usa-button usa-button--unstyled flex justify-center items-center bg-slate-100 hover:bg-slate-200 cursor-pointer p-3 text-lg font-semibold rounded-lg"
          :disabled="page === 1"
          @click="goto(page - 1)"
        >‹</button>
      </li>

      <!-- always show first page -->
      <li
        v-if="visiblePages[0] > 1"
        class="usa-pagination__item bg-slate-100 rounded-md  no-underline"
      >
        <button class="usa-button usa-button--unstyled flex justify-center items-center bg-slate-100 hover:bg-slate-200 cursor-pointer p-3 text-lg font-semibold rounded-lg" @click="goto(1)">1</button>
      </li>
      <li
        v-if="visiblePages[0] > 2"
        class="usa-pagination__item  !text-decoration-none flex justify-center items-center bg-slate-100 hover:bg-slate-200 cursor-pointer p-3 text-lg font-semibold rounded-lg "
      ><span>…</span></li>

      <!-- sliding window -->
      <li
        v-for="p in visiblePages"
        :key="p"
        class="usa-pagination__item bg-slate-100 rounded-md !text-decoration-noneflex justify-center items-center "
        :class="{ 'usa-pagination__item--current': p === page }"
      >
        <button
          v-if="p !== page"
          class="usa-button usa-button--unstyled flex justify-center items-center bg-slate-100 hover:bg-slate-200 cursor-pointer p-3 text-lg font-semibold rounded-lg"
          @click="goto(p)"
        >{{ p }}</button>
        <span v-else>{{ p }}</span>
      </li>

      <!-- ellipsis before last -->
      <li
        v-if="visiblePages[visiblePages.length - 1] < totalPages - 1"
        class="usa-pagination__item flex justify-center items-center bg-slate-100 hover:bg-slate-200 cursor-pointer p-3 text-lg font-semibold rounded-lg"
      ><span>…</span></li>
      <!-- always show last page -->
      <li
        v-if="visiblePages[visiblePages.length - 1] < totalPages"
        class="usa-pagination__item flex justify-center items-center"
      >
        <button
          class="usa-button usa-button--unstyled flex justify-center items-center bg-slate-100 hover:bg-slate-200 cursor-pointer p-3 text-lg font-semibold rounded-lg"
          @click="goto(totalPages)"
        >{{ totalPages }}</button>
      </li>

      <!-- next arrow -->
      <li class="usa-pagination__item usa-pagination__item--arrow flex justify-center items-center">
        <button
          class="usa-button usa-button--unstyled flex justify-center items-center bg-slate-100 hover:bg-slate-200 cursor-pointer p-3 text-lg font-semibold rounded-lg"
          :disabled="page === totalPages"
          @click="goto(page + 1)"
        >›</button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.usa-table { margin-top: 1rem; }
.usa-pagination { display: block; }
</style>
