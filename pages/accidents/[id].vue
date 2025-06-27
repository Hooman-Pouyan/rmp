<template>
  <section class="usa-section max-w-screen-lg mx-auto">
    <!-- ── loading / error ─────────────────────────── -->
    <div v-if="pending" class="flex flex-col items-center gap-2 py-24">
      <span class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></span>
      <span class="text-lg font-medium">Loading accident …</span>
    </div>

    <div v-else-if="error" class="usa-alert usa-alert--error usa-alert--slim my-8">
      <div class="usa-alert__body">
        <p class="usa-alert__text font-semibold">{{ error }}</p>
      </div>
    </div>

    <!-- ── full detail ─────────────────────────────── -->
    <template v-else>
      <!-- header -->
      <header class="mb-6">
        <h1 class="text-3xl font-bold">
          Accident #{{ acc.accidentHistoryId }}
        </h1>
        <p class="text-gray-600">
          {{ acc.accidentDate }} • {{ acc.accidentTime }} • NAICS {{ acc.naicsCode }}
        </p>
      </header>

      <!-- BASIC INFO -->
      <details open class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Basic Information
        </summary>
        <div class="px-4 py-3">
          <KeyVal :source="pick(['accidentDate','accidentTime','naicsCode','accidentReleaseDuration'])" />
        </div>
      </details>

      <!-- RELEASE CHARACTERISTICS -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Release Characteristics
        </summary>
        <div class="px-4 py-3">
          <KeyVal yesNo :source="pick([
            'reGas','reSpill','reFire','reExplosion','reReactiveIncident'
          ])" />
        </div>
      </details>

      <!-- RELEASE SOURCE -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Release Source
        </summary>
        <div class="px-4 py-3">
          <KeyVal yesNo :source="pick([
            'rsStorageVessel','rsPiping','rsProcessVessel','rsTransferHose',
            'rsValve','rsPump','rsJoint','otherReleaseSource'
          ])" />
        </div>
      </details>

      <!-- WEATHER -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Weather Conditions
        </summary>
        <div class="px-4 py-3">
          <KeyVal yesNo :source="pick([
            'windSpeed','windSpeedUnitCode','windDirection','temperature',
            'stabilityClass','precipitation','weatherUnknown'
          ])" />
        </div>
      </details>

      <!-- IMPACTS -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Human & Property Impacts
        </summary>
        <div class="px-4 py-3">
          <KeyVal :source="pick([
            'deathsWorkers','deathsPublicResponders','deathsPublic',
            'injuriesWorkers','injuriesPublicResponders','injuriesPublic',
            'onsitePropertyDamage','offsitePropertyDamage',
            'offsiteDeaths','hospitalization','medicalTreatment',
            'evacuated','shelteredInPlace'
          ])" />
        </div>
      </details>

      <!-- ENVIRONMENTAL DAMAGE -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Environmental Damage
        </summary>
        <div class="px-4 py-3">
          <KeyVal yesNo :source="pick([
            'edKills','edMinorDefoliation','edWaterContamination',
            'edSoilContamination','edOther'
          ])" />
        </div>
      </details>

      <!-- CAUSES -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Causes & Contributing Factors
        </summary>
        <div class="px-4 py-3">
          <KeyVal yesNo :source="pick([
            'initiatingEvent','cfEquipmentFailure','cfHumanError',
            'cfImproperProcedure','cfOverpressurization','cfUpsetCondition',
            'cfBypassCondition','cfMaintenance','cfProcessDesignFailure',
            'cfUnsuitableEquipment','cfUnusualWeather','cfManagementError',
            'cfOther'
          ])" />
        </div>
      </details>

      <!-- CORRECTIVE ACTIONS -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Corrective Actions
        </summary>
        <div class="px-4 py-3">
          <KeyVal yesNo :source="pick([
            'ciImprovedEquipment','ciRevisedMaintenance','ciRevisedTraining',
            'ciRevisedOpProcedures','ciNewProcessControls','ciNewMitigationSystems',
            'ciRevisedErPlan','ciChangedProcess','ciReducedInventory','ciNone',
            'ciOtherType'
          ])" />
        </div>
      </details>

      <!-- COMPLIANCE -->
      <details class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Compliance & Notifications
        </summary>
        <div class="px-4 py-3">
          <KeyVal yesNo :source="pick([
            'offsiteRespondersNotify','publicMeeting','publicMeetingDate','cbiFlag'
          ])" />
        </div>
      </details>

      <!-- CHEMICALS -->
      <details open class="usa-accordion__item border border-gray-200 rounded mb-3">
        <summary class="usa-accordion__button bg-gray-100 px-4 py-2 font-semibold">
          Chemicals Released ({{ chemicals.length }})
        </summary>
        <div class="px-4 py-3 overflow-x-auto">
          <table class="usa-table usa-table--striped min-w-full">
            <thead><tr><th>Chemical</th><th>Quantity</th><th>% Weight</th></tr></thead>
            <tbody>
              <tr v-for="c in chemicals" :key="c.key">
                <td>{{ c.chemicalName }}</td>
                <td>{{ c.quantityReleased }}</td>
                <td>{{ c.percentWeight ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useRoute, useAsyncData } from '#app'
import { computed, defineComponent, h } from 'vue'

/* ---------- fetch accident record ----------------------------- */
const id = useRoute().params.id as string
const { data: acc, pending, error } = await useAsyncData(
  `acc-${id}`,
  () => $fetch(`/api/accidents/${id}`)
)

/* ---------- helpers ------------------------------------------- */
const pick = (keys: string[]) => {
  const out: Record<string, any> = {}
  if (!acc.value) return out
  keys.forEach(k => { if (k in acc.value) out[k] = acc.value[k] })
  return out
}

const chemicals = computed(() => {
  if (!acc.value?.chemicals) return []
  const map = new Map<string, any>()
  acc.value.chemicals.forEach(c => {
    const key = `${c.chemicalId}-${c.quantityReleased}-${c.percentWeight}`
    if (!map.has(key)) map.set(key, { ...c, key })
  })
  return Array.from(map.values())
})

/* ---------- inline <KeyVal> component ------------------------- */
const KeyVal = defineComponent({
  props: { source: { type: Object, required: true }, yesNo: Boolean },
  setup(props) {
    return () =>
      h('table', { class: 'usa-table w-full border-t border-gray-200' }, [
        h('tbody', {},
          Object.entries(props.source).map(([k, v]) =>
            h('tr', { key: k, class: 'border-b border-gray-100' }, [
              h('td', { class: 'font-medium w-1/3 break-words pr-3 py-1 capitalize' }, k),
              h('td', { class: 'py-1' }, props.yesNo
                ? h('span', { class: v === 'Yes' ? 'yes' : v === 'No' ? 'no' : '' }, v ?? '—')
                : (v ?? '—')
              )
            ])
          )
        )
      ])
  }
})
</script>

<style scoped>
.yes { color:#027a48; font-weight:600 }
.no  { color:#b91c1c; font-weight:600 }
</style>