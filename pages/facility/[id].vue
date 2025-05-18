<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useFetch } from '#app'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const facility = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const { data, error: fetchError } = await useFetch(`/api/facilities/${id}`)
    if (fetchError.value) {
      error.value = fetchError.value.message || "Failed to load facility."
      return
    }
    facility.value = data.value
  } catch (err) {
    error.value = "An unexpected error occurred."
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section v-if="loading" class="usa-prose">
    <p>Loading…</p>
  </section>

  <section v-else-if="error" class="usa-prose">
    <p class="usa-alert usa-alert--error">{{ error }}</p>
  </section>

  <section v-else class="usa-prose">
    <h2>{{ facility?.name }}</h2>
    <ul>
      <li><strong>EPA Facility ID:</strong> {{ facility?.EPAFacilityID }}</li>
      <li><strong>Address:</strong> {{ facility?.address }}</li>
      <li><strong>City:</strong> {{ facility?.city }}</li>
      <li><strong>State:</strong> {{ facility?.state }}</li>
      <li><strong>ZIP:</strong> {{ facility?.zip }}</li>
    </ul>

    <h3>Submissions</h3>
    <ul>
      <li v-for="sub in facility?.submissions" :key="sub.id">
        #{{ sub.id }} — {{ sub.date_val }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.usa-prose {
  margin-top: 1rem;
}
.usa-alert {
  color: #d91e18;
  font-weight: bold;
}
</style>
