<script setup lang="ts">
const props = defineProps<{ modelValue: any }>()
const emit  = defineEmits<{ (e:'update:modelValue', v:any): void }>()

function set(key: string, val: any) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
const f = props.modelValue

// example lists; replace with your real data
const chemicalsList = [
  { id: 'NH3', name: 'Ammonia' },
  { id: 'CL2', name: 'Chlorine' },
  { id: 'HCL', name: 'Hydrochloric Acid' },
  { id: 'CH3OH', name: 'Methanol' }
]

const naicsList = [
  { id: '211120', name: '211120 – Crude Petroleum Extraction' },
  { id: '325412', name: '325412 – Pharmaceutical Preparation Manufacturing' },
  { id: '325199', name: '325199 – Basic Organic Chemical Manufacturing' },
  { id: '332710', name: '332710 – Machine Shops' }
]
</script>

<template>
  <fieldset class="usa-fieldset margin-bottom-2">
    <legend class="usa-legend margin-top-0">Process</legend>

    <div class="grid-row grid-gap">
      <!-- Chemical(s) as a normal dropdown -->
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
          <option value="1">Program 1</option>
          <option value="2">Program 2</option>
          <option value="3">Program 3</option>
        </select>
      </div>

      <!-- NAICS Code(s) as a normal dropdown -->
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
.margin-top-2 { margin-top: 1.5rem; }
</style>
