<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ modelValue: any }>()
const emit  = defineEmits<{ (e:'update:modelValue', v:any): void }>()

function set(key: string, val: any) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
const f = props.modelValue

const states   = ref<{abbr:string;name:string}[]>([])
const counties = ref<{fips:string;name:string}[]>([])

onMounted(async () => {
  const res = await fetch('/api/states')
  console.log({res});
  
  states.value = await res.json()
})

watch(() => f.state, async (abbr) => {
  if (!abbr) {
    counties.value = []
    set('county', '')
    return
  }
  const res = await fetch(`/api/states?abbr=${abbr || ''}`)
  const json = await res.json()
  counties.value = json.counties
  set('county', '')
})
</script>

<template>
  <fieldset class="usa-fieldset margin-bottom-4">

    <div class="grid grid-cols-2">

<!-- Address -->
<div class="col-span-1">
  <label class="usa-label" for="address">Address</label>
  <input id="address" class="usa-input"
         :value="f.address"
         @input="e=>set('address',(e.target as HTMLInputElement).value)" />

  <div class="margin-top-1">
    <label class="usa-radio margin-right-2">
      <input class="usa-radio__input" type="radio" name="addrMatch"
             :checked="f.exactAddress" @change="set('exactAddress',true)">
      <span class="usa-radio__label">Exact</span>
    </label>
    <label class="usa-radio">
      <input class="usa-radio__input" type="radio" name="addrMatch"
             :checked="!f.exactAddress" @change="set('exactAddress',false)">
      <span class="usa-radio__label">Contains</span>
    </label>
  </div>
</div>

            <!-- City -->
      <div class="col-span-1">
        <label class="usa-label" for="city">City</label>
        <input
          id="city"
          class="usa-input"
          type="text"
          :value="f.city"
          @input="e => set('city', (e.target as HTMLInputElement).value)"
        />
      </div>


      <!-- State -->
      <div class="col-span-1">
        <label class="usa-label" for="state">State</label>
        <select
          id="state"
          class="usa-select"
          :value="f.state"
          @change="e => set('state', (e.target as HTMLSelectElement).value)"
        >
          <option value="">Select state</option>
          <option v-for="s in states" :key="s.abbr" :value="s.abbr">
            {{ s.name }}
          </option>
        </select>
      </div>

      <!-- County -->
      <div class="col-span-1">
        <label class="usa-label" for="county">County</label>
        <select
          id="county"
          class="usa-select"
          :value="f.county"
          :disabled="!counties.length"
          @change="e => set('county', (e.target as HTMLSelectElement).value)"
        >
          <option value="">Select county</option>
          <option v-for="c in counties" :key="c.fips" :value="c.fips">
            {{ c.name }}
          </option>
        </select>
      </div>

      <!-- zip -->
      <div class="col-span-1">
        <label class="usa-label" for="zip">zip</label>
        <input
          id="zip"
          class="usa-input"
          type="text"
          :value="f.zip"
          @input="e => set('zip', (e.target as HTMLInputElement).value)"
        />
      </div>


    </div>
  </fieldset>
</template>

<style scoped>
</style>
