<script setup lang="ts">
const props = defineProps<{ modelValue: any }>()
const emit  = defineEmits<{ (e:'update:modelValue', v:any): void }>()

function set(key: string, val: any) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
const f = props.modelValue
</script>

<template>
  <fieldset class="usa-fieldset margin-bottom-4">
    <legend class="usa-legend margin-bottom-2">Facility</legend>

    <div class="grid-row grid-gap-2">
      <!-- Facility Name -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="fac-name">EPA Facility Name</label>
        <input
          id="fac-name"
          class="usa-input"
          type="text"
          :value="f.facilityName"
          @input="e => set('facilityName', (e.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Facility ID -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="fac-id">Facility ID</label>
        <input
          id="fac-id"
          class="usa-input"
          type="text"
          :value="f.facilityId"
          @input="e => set('facilityId', (e.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Active only -->
      <div class="tablet:grid-col-12 usa-checkbox margin-top-2">
        <input
          id="activeOnly"
          type="checkbox"
          class="usa-checkbox__input"
          :checked="f.activeOnly"
          @change="e => set('activeOnly', (e.target as HTMLInputElement).checked)"
        />
        <label for="activeOnly" class="usa-checkbox__label">
          Show only active facilities
        </label>
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
/* no extra CSS needed */
</style>
