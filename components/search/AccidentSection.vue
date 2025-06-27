<script setup lang="ts">
/**
 * Simple filter block for accidents:
 *   • hasAccidents  – yes / no
 *   • date range    – from / to (YYYY-MM-DD)
 *   • time range    – from / to (HH:MM, 24 h)
 *
 * It follows the same v-model contract the other sections use.
 */
const props = defineProps<{ modelValue:any }>()
const emit  = defineEmits<{ (e:'update:modelValue', v:any):void }>()

function set (key:string, val:any){
  emit('update:modelValue', { ...props.modelValue, [key]:val })
}

const f = props.modelValue
</script>

<template>
  <fieldset class="usa-fieldset margin-bottom-2">

    <!-- Has accidents toggle -->
    <div class="margin-bottom-2">
      <input  class="usa-checkbox__input"
              type="checkbox"
              id="hasAcc"
              :checked="f.hasAccidents"
              @change="set('hasAccidents', $event.target.checked)" />
      <label  class="usa-checkbox__label" for="hasAcc">
        Show facilities that have accidents only
      </label>
    </div>

    <!-- Date range -->
    <div class="grid-row grid-gap">
      <div class="tablet:grid-col-6">
        <label class="usa-label"  for="accFromDate">Accident Date – From</label>
        <input  id="accFromDate"  class="usa-input"
                type="date"
                :value="f.accFromDate"
                @change="set('accFromDate', $event.target.value)" />
      </div>

      <div class="tablet:grid-col-6">
        <label class="usa-label"  for="accToDate">Accident Date – To</label>
        <input  id="accToDate"    class="usa-input"
                type="date"
                :value="f.accToDate"
                @change="set('accToDate', $event.target.value)" />
      </div>
    </div>

    <!-- Time range -->
    <div class="grid-row grid-gap margin-top-2">
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="accFromTime">Accident Time – From</label>
        <input  id="accFromTime" class="usa-input"
                type="time"
                :value="f.accFromTime"
                @change="set('accFromTime', $event.target.value)" />
      </div>

      <div class="tablet:grid-col-6">
        <label class="usa-label" for="accToTime">Accident Time – To</label>
        <input  id="accToTime"   class="usa-input"
                type="time"
                :value="f.accToTime"
                @change="set('accToTime', $event.target.value)" />
      </div>
    </div>

  </fieldset>
</template>

<style scoped>
.margin-bottom-2 { margin-bottom: 1.5rem; }
.margin-top-2    { margin-top:    1.5rem; }
</style>