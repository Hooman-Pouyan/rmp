<script setup lang="ts">
const props = defineProps<{ modelValue: any }>()
const emit  = defineEmits<{ (e:'update:modelValue', v:any): void }>()

function set(k:string, v:any) {
  emit('update:modelValue', { ...props.modelValue, [k]: v })
}
const f = props.modelValue
</script>

<template>
  <fieldset class="usa-fieldset margin-bottom-4">

    <div class="grid-row grid-gap">

      <!-- EPA Facility Name -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="fac-name">EPA Facility Name</label>
        <input id="fac-name" class="usa-input"
               :value="f.facilityName"
               @input="e=>set('facilityName',(e.target as HTMLInputElement).value)" />

        <!-- exact / contains radio -->
        <div class="margin-top-1">
          <label class="usa-radio margin-right-2">
            <input class="usa-radio__input" type="radio" name="facNameMatch"
                   :checked="f.exactFacilityName" @change="set('exactFacilityName',true)">
            <span class="usa-radio__label">Exact</span>
          </label>
          <label class="usa-radio">
            <input class="usa-radio__input" type="radio" name="facNameMatch"
                   :checked="!f.exactFacilityName" @change="set('exactFacilityName',false)">
            <span class="usa-radio__label">Contains</span>
          </label>
        </div>
      </div>

      <!-- Facility ID -->
      <div class="tablet:grid-col-6">
        <label class="usa-label" for="fac-id">Facility ID</label>
        <input id="fac-id" class="usa-input"
               :value="f.facilityId"
               @input="e=>set('facilityId',(e.target as HTMLInputElement).value)" />
      </div>

      <!-- Parent Company Name -->
      <div class="tablet:grid-col-6 margin-top-2">
        <label class="usa-label" for="parent">Parent Company Name</label>
        <input id="parent" class="usa-input"
               :value="f.ParentCompanyName"
               @input="e=>set('ParentCompanyName',(e.target as HTMLInputElement).value)" />

        <div class="margin-top-1">
          <label class="usa-radio margin-right-2">
            <input class="usa-radio__input" type="radio" name="parentMatch"
                   :checked="f.exactParent" @change="set('exactParent',true)">
            <span class="usa-radio__label">Exact</span>
          </label>
          <label class="usa-radio">
            <input class="usa-radio__input" type="radio" name="parentMatch"
                   :checked="!f.exactParent" @change="set('exactParent',false)">
            <span class="usa-radio__label">Contains</span>
          </label>
        </div>
      </div>

      <!-- Facility DUNS -->
      <div class="tablet:grid-col-6 margin-top-2">
        <label class="usa-label" for="duns">Facility DUNS</label>
        <input id="duns" class="usa-input"
               :value="f.facilityDUNS"
               @input="e=>set('facilityDUNS',(e.target as HTMLInputElement).value)" />
      </div>

      <!-- Active only -->
      <div class="tablet:grid-col-12 usa-checkbox margin-top-2">
        <input id="activeOnly" type="checkbox" class="usa-checkbox__input"
               :checked="f.activeOnly"
               @change="e=>set('activeOnly',(e.target as HTMLInputElement).checked)" />
        <label for="activeOnly" class="usa-checkbox__label">Show only active facilities</label>
      </div>
    </div>
  </fieldset>
</template>
