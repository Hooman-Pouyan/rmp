<template>
  <section class="usa-section">
    <div v-if="loading" class="usa-prose">Loading…</div>
    <div v-else-if="error" class="usa-alert usa-alert--error">{{ error }}</div>
    <div v-else class="usa-prose">
      <h1>Accident #{{ accident?.accidentHistoryId }}</h1>
      <dl class="usa-identifier-list">
        <div class="usa-identifier-list__item">
          <dt class="usa-identifier-list__label">Date</dt>
          <dd class="usa-identifier-list__value">{{ accident?.accidentDate }}</dd>
        </div>
        <div class="usa-identifier-list__item">
          <dt class="usa-identifier-list__label">Time</dt>
          <dd class="usa-identifier-list__value">{{ accident?.accidentTime }}</dd>
        </div>
        <div class="usa-identifier-list__item">
          <dt class="usa-identifier-list__label">Explosion?</dt>
          <dd class="usa-identifier-list__value">{{ accident?.cfExplosion }}</dd>
        </div>
        <div class="usa-identifier-list__item">
          <dt class="usa-identifier-list__label">Fire?</dt>
          <dd class="usa-identifier-list__value">{{ accident?.cfFire }}</dd>
        </div>
        <!-- … any other flags … -->
      </dl>

      <h2>Chemicals Released</h2>
      <table class="usa-table">
        <thead>
          <tr>
            <th>Chemical</th>
            <th>Quantity</th>
            <th>Percent</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in accident?.chemicals" :key="c.chemicalId">
            <td>{{ c.chemicalName }}</td>
            <td>{{ c.quantityReleased }}</td>
            <td>{{ c.percentWeight }}</td>
          </tr>
          <tr v-if="!accident?.chemicals.length">
            <td colspan="3" class="text-center">None</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFetch } from '#app'

interface AccidentDetail {
  accidentHistoryId: number
  accidentDate: string
  accidentTime: string
  cfExplosion: string
  cfFire: string
  // … other flags …
  chemicals: Array<{
    chemicalId: number
    chemicalName: string
    quantityReleased: number
    percentWeight: number
  }>
}

const route = useRoute()
const id = route.params.id as string

const accident: any = ref<AccidentDetail | null>(null)
const loading  = ref(true)
const error    = ref('')

onMounted(async () => {
  console.log("iDDDDDD", id);
  
  const { data, error: fetchError } = await useFetch<AccidentDetail>(`/api/accidents/${id}`)
  if (fetchError.value) {
    error.value = fetchError.value.message
  } else {
    accident.value = data.value
  }
  loading.value = false
})
</script>

<style scoped>
.usa-identifier-list__label { font-weight:600; }
.usa-identifier-list__value { margin-bottom:1rem; }
</style>