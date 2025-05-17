<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useFetch } from 'nuxt/app'

const route = useRoute()
const id = route.params.id as string
const facility = ref<any>(null)

onMounted(async () => {
  const { data } = await useFetch(`/api/facility/${id}`)
  facility.value = data.value
})
</script>

<template>
  <section v-if="facility" class="usa-prose">
    <h2>{{ facility.name }}</h2>
    <ul>
      <li><strong>EPAFacilityID:</strong> {{ facility.EPAFacilityID }}</li>
      <li><strong>Address:</strong> {{ facility.address }}</li>
      <li><strong>City:</strong> {{ facility.city }}</li>
      <li><strong>State:</strong> {{ facility.state }}</li>
      <li><strong>ZIP:</strong> {{ facility.zip }}</li>
    </ul>

    <h3>Submissions</h3>
    <ul>
      <li v-for="sub in facility.submissions" :key="sub.id">
        #{{ sub.id }} — {{ sub.date_val }}
      </li>
    </ul>
  </section>
  <p v-else class="usa-prose">Loading…</p>
</template>

<style scoped>
</style>
