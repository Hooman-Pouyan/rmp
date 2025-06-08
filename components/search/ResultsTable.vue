<script setup lang="ts">
import { computed } from 'vue'
import type { FacilityLite } from '~/core/types/facility'

const props = defineProps<{
  rows: FacilityLite[]
  total: number
  page: number
  perPage: number
}>()

const emit = defineEmits<{
  (e: 'page-changed', newPage: number): void
}>()

// total number of pages
const totalPages = computed(() =>
  Math.ceil(props.total / props.perPage)
)

// how many numbered buttons to show in the middle
const windowSize = 5
let loading = true

// compute the sliding window of page numbers
const visiblePages = computed(() => {
  const tp = totalPages.value
  if (tp) loading = false
  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, props.page - half)
  let end = Math.min(tp, props.page + half)

  // if we’re at the very start or end, extend the window
  if (props.page <= half) {
    end = Math.min(tp, windowSize)
  }
  if (props.page + half > tp) {
    start = Math.max(1, tp - windowSize + 1)
  }
  const pages = []
  for (let p = start; p <= end; p++) pages.push(p)
  return pages
})

function goto(p: number) {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('page-changed', p)
}
</script>

<template>


    <nav class="usa-pagination !no-underline" v-if="totalPages > 1">
    <ul class="usa-pagination__list">
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
  
  <table class="usa-table usa-table--striped usa-table--borderless w-full" v-if="rows.length">
    <thead>
      <tr>
        <th>EPA ID</th>
        <th>Facility</th>
        <th>State</th>
        <th>City</th>
        <th>Parent Company</th>
        <th>Last Validated</th>
        <th>Accidents</th>
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
    <td>—</td> <!-- You can replace this with a valid field if you later store last submission date -->
    <td>{{ r.accidents?.length ?? 0 }}</td>
  </tr>
</tbody>
  </table>

  <p v-else class="usa-prose text-center">No matches.</p>


</template>

<style scoped>
.usa-table { margin-top: 1rem; }
.usa-pagination { display: flex; justify-content: center; margin: 1rem 0; }
</style>
