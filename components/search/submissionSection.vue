<template>
  <fieldset class="usa-fieldset margin-bottom-2">
    <!-- Submission snapshot selector -->
    <legend class="usa-legend">Submission snapshot</legend>

    <div class="margin-top-1">
      <input
        class="usa-radio__input"
        type="radio"
        id="sub-latest"
        name="sub-date"
        value="latest"
        :checked="current === 'latest'"
        @change="set('latest')"
      />
      <label class="usa-radio__label" for="sub-latest">Latest</label>
    </div>

    <div class="margin-top-1">
      <input
        class="usa-radio__input"
        type="radio"
        id="sub-all"
        name="sub-date"
        value="all"
        :checked="current === 'all'"
        @change="set('all')"
      />
      <label class="usa-radio__label" for="sub-all">All (cumulative)</label>
    </div>

    <div class="margin-top-1">
      <input
        class="usa-radio__input"
        type="radio"
        id="sub-specific"
        name="sub-date"
        value="specific"
        :checked="current === 'specific'"
        @change="set('specific')"
      />
      <label class="usa-radio__label" for="sub-specific">Specific date</label>

      <input
        v-if="current === 'specific'"
        type="date"
        class="usa-input margin-left-2"
        :value="specificDate"
        @change="onDateChange($event.target.value)"
      />
    </div>

    <p class="usa-hint margin-top-05">
      • <strong>Latest</strong>: shows each facility's most-recent submission.<br>
      • <strong>All</strong>: no date filter; cumulative accidents visible.<br>
      • <strong>Specific</strong>: pick a ReceiptDate snapshot (YYYY-MM-DD).
    </p>
  </fieldset>
</template>

<script setup lang="ts">
/**
 * Minimal snapshot filter (no external API needed).
 * Emits an object with { submissionDate }:
 *   • null   → Latest
 *   • 'ALL'  → cumulative accidents
 *   • 'YYYY-MM-DD' → specific date
 */
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: any }>()
const emit  = defineEmits<{ (e: 'update:modelValue', v: any): void }>()

const current       = ref<'latest' | 'all' | 'specific'>('latest')
const specificDate  = ref<string>('')

// sync incoming modelValue
watch(() => props.modelValue?.submissionDate, (val) => {
  if (val == null)      { current.value = 'latest'  }
  else if (val === 'ALL'){ current.value = 'all'     }
  else                  { current.value = 'specific'; specificDate.value = val }
}, { immediate:true })

function set(mode: 'latest' | 'all' | 'specific'){
  current.value = mode
  if (mode === 'latest')   emit('update:modelValue', { submissionDate: null })
  else if (mode === 'all') emit('update:modelValue', { submissionDate: 'ALL' })
  // for 'specific', we'll wait for date input
}

function onDateChange(val:string){
  specificDate.value = val
  emit('update:modelValue', { submissionDate: val })
}
</script>

<style scoped>
.margin-bottom-2 { margin-bottom: 1.5rem; }
.margin-top-05   { margin-top: 0.5rem; }
.margin-left-2   { margin-left: 0.5rem; }
</style>