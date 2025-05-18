<script setup lang="ts">
import type { FacilityLite } from '~/core/types/facility'
const props = defineProps<{ rows: FacilityLite[] }>()
</script>

<template>
  <table class="usa-table !w-full usa-table--borderless usa-table--striped" v-if="props.rows.length">
    <thead class="usa-table__head">
      <tr class="usa-table__row">
        <th class="usa-table__header">EPA ID</th>
        <th class="usa-table__header">Facility</th>
        <th class="usa-table__header">State</th>
        <th class="usa-table__header">City</th>
        <th class="usa-table__header">Address</th>
        <th class="usa-table__header">Last Validated</th>
        <th class="usa-table__header">Accidents</th>
      </tr>
    </thead>
    <tbody class="usa-table__body">
      <tr class="usa-table__row" v-for="r in props.rows" :key="r.EPAFacilityID">
                      <td class="usa-table__cell">{{ r.EPAFacilityID }}</td>
        <td class="usa-table__cell">
          <NuxtLink :to="`/facility/${r.EPAFacilityID}`">{{ r.name }}</NuxtLink>
        </td>
        <td class="usa-table__cell">{{ r.state.name }}</td>
        <td class="usa-table__cell">{{ r.city }}</td>
        <td class="usa-table__cell">{{ r.address }}</td>
        <td class="usa-table__cell">{{ r.sub_last?.date_val || '—' }}</td>
        <td class="usa-table__cell">{{ r.sub_last?.num_accidents ?? '—' }}</td>
      </tr>
    </tbody>
  </table>
  <p v-else class="text-center usa-prose">No matches.</p>

  <!-- Pagination stub -->
  <nav class="usa-pagination" v-if="props.rows.length">
    <ul class="usa-pagination__list">
      <li class="usa-pagination__item usa-pagination__item--arrow">
        <button class="usa-button usa-button--unstyled" disabled>‹</button>
      </li>
      <li class="usa-pagination__item usa-pagination__item--current"><span>1</span></li>
      <li class="usa-pagination__item"><button class="usa-button usa-button--unstyled">2</button></li>
      <li class="usa-pagination__item"><button class="usa-button usa-button--unstyled">3</button></li>
      <li class="usa-pagination__item usa-pagination__item--arrow">
        <button class="usa-button usa-button--unstyled">›</button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.usa-table { margin-top: 1.5rem; }
.usa-pagination { display: flex; justify-content: center; margin-top: 1rem; }
</style>
