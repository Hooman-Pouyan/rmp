<script setup lang="ts">
import { useFetch } from 'nuxt/app';
import { ref, onMounted } from 'vue'

const props = defineProps<{ modelValue: any }>()
const emit  = defineEmits<{ (e:'update:modelValue', v:any): void }>()

function set(key: string, val: any) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
const f = props.modelValue

interface Option { id: string; name: string }

/* Reactive option lists (filled onMounted) */
const chemicalsList = ref<Option[]>([])
const naicsList     = ref<Option[]>([])

onMounted(async () => {
  /* 1️⃣  Load dictionaries once (bundled via Nuxt static folder) */
  const lookups  = await fetch("https://data-liberation-project.github.io/epa-rmp-viewer/data/lookups/lookups.json")
    .then(res => res.json())
    .catch(err => {
      console.error("Failed to load lookups data:", err)
      return { ok: false }
    })


  /* 2️⃣  Chemicals — show short name, keep ChemicalID as value */
  chemicalsList.value = Object.entries(lookups.ChemicalID)
    .map(([id, full]) => {
      const short = String(full).split('[')[0].trim()
      return { id, name: short }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  /* 3️⃣  NAICS — prepend code so users can search visually */
  naicsList.value = Object.entries(lookups.NAICSCode)
    .map(([id, txt]) => ({ id, name: `${id} – ${String(txt)}` }))
    .sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <fieldset class="usa-fieldset margin-bottom-2">

    <div class="grid-row grid-gap">
      <!-- Chemical(s) -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="chemicals">Chemical(s)</label>
        <select
          id="chemicals"
          class="usa-select"
          :value="f.chemicals[0] || ''"
          @change="e => set('chemicals', e.target.value ? [e.target.value] : [])"
        >
          <option value="">Select Chemical(s)</option>
          <option v-for="c in chemicalsList" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <!-- Chemical Type -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="chemicalType">Chemical Type</label>
        <select
          id="chemicalType"
          class="usa-select"
          :value="f.chemicalType"
          @change="e => set('chemicalType', e.target.value)"
        >
          <option value="">Select Chemical Type</option>
          <option value="toxic">Toxic</option>
          <option value="flammable">Flammable</option>
        </select>
      </div>
    </div>

    <div class="grid-row grid-gap margin-top-2">
      <!-- Program Level -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="programLevel">Program Level</label>
        <select
          id="programLevel"
          class="usa-select"
          :value="f.programLevel"
          @change="e => set('programLevel', e.target.value)"
        >
          <option value="">Select Program Level</option>
          <option value="1">Program&nbsp;1</option>
          <option value="2">Program&nbsp;2</option>
          <option value="3">Program&nbsp;3</option>
        </select>
      </div>

      <!-- NAICS Code(s) -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="naicsCodes">NAICS Code(s)</label>
        <select
          id="naicsCodes"
          class="usa-select"
          :value="f.naicsCodes[0] || ''"
          @change="e => set('naicsCodes', e.target.value ? [e.target.value] : [])"
        >
          <option value="">Select NAICS Code(s)</option>
          <option v-for="n in naicsList" :key="n.id" :value="n.id">
            {{ n.name }}
          </option>
        </select>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.margin-bottom-2 { margin-bottom: 1.5rem; }
.margin-top-0   { margin-top:     0; }
.margin-top-2   { margin-top:  1.5rem; }
</style>