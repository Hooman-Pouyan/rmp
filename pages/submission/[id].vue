<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { useFetch } from '#app'

// We don’t have a strict TS interface for this huge object, so use `any`.
type AnyObject = Record<string, any>

const route = useRoute()
const id = route.params.id as string

// loading / error state
const loading = ref<boolean>(true)
const error = ref<string | null>(null)

// The fetched submission data
const submission = ref<AnyObject | null>(null)

// Helper to turn an object into [key, value][] for v-for
function objectEntries(obj: AnyObject): Array<[string, any]> {
  return Object.entries(obj)
}

// Once mounted, fetch `/api/submissions/:id`
onMounted(async () => {
  try {
    const { data, error: fetchError } = await useFetch<AnyObject>(`/api/submissions/${id}`)
    if (fetchError.value) {
      error.value = fetchError.value.message || 'Failed to load submission.'
    } else {
      submission.value = data.value
    }
  } catch (err: any) {
    error.value = err.message || 'Unexpected error.'
  } finally {
    loading.value = false
  }
})

// Split the data into its sections
const topLevelFields = computed<AnyObject>(() => {
  if (!submission.value) return {}
  const out: AnyObject = {}
  for (const [k, v] of Object.entries(submission.value)) {
    if (['_processes', '_accidents', '_emerg_resp', '_exec_summary'].includes(k)) continue
    out[k] = v
  }
  return out
})

const processes = computed<any[]>(() => submission.value?._processes ?? [])
const accidents = computed<any[]>(() => submission.value?._accidents ?? [])
const emergResp = computed<AnyObject | null>(() => submission.value?._emerg_resp ?? null)
const execSummary = computed<Array<AnyObject>>(() => submission.value?._exec_summary ?? [])
</script>

<template>
  <section v-if="loading" class="padding h-screen">
    <p>Loading…</p>
  </section>

  <section v-else-if="error" class="padding">
    <p class="error-text">{{ error }}</p>
  </section>

  <section v-else class="container">
    <!-- Header + Intro -->
    <header class="header">
      <h1 class="title">Submission #{{ submission?.id || id }}</h1>
      <p class="intro">
        Below you’ll find every field for this RMP submission. Click any section header to expand or collapse it.
      </p>
      <!-- Quick navigation links -->
      <nav class="nav-links">
        <a href="#submissionDetails">Details</a>
        <a v-if="processes.length" href="#processSection">Processes</a>
        <a v-if="accidents.length" href="#accidentSection">Accidents</a>
        <a v-if="emergResp" href="#emergRespSection">Emergency Response</a>
        <a v-if="execSummary.length" href="#execSummarySection">Executive Summary</a>
      </nav>
    </header>

    <!-- Submission Details -->
    <details id="submissionDetails" open class="section">
      <summary class="section-summary">Submission Details</summary>
      <div class="section-content">
        <table class="full-width-table">
          <tbody>
            <tr v-for="[key, val] in objectEntries(topLevelFields)" :key="key">
              <td class="cell-key">{{ key }}</td>
              <td class="cell-val">
                <span v-if="val === null || val === undefined">—</span>
                <span v-else>{{ val }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <!-- Processes -->
    <details v-if="processes.length" id="processSection" class="section">
      <summary class="section-summary">Processes ({{ processes.length }})</summary>
      <div class="section-content">
        <div v-for="(proc, pi) in processes" :key="pi" class="subsection">
          <details open class="subsection-details">
            <summary class="subsection-summary">Process #{{ pi + 1 }}</summary>
            <div class="subsection-content">
              <table class="full-width-table">
                <tbody>
                  <tr v-for="[key, val] in objectEntries(proc)" :key="key">
                    <div v-if="!['_chemicals','_naics'].includes(key)">
                    <td class="cell-key">{{ key }}</td>
                    <td class="cell-val">
                      <span v-if="val === null || val === undefined">—</span>
                      <span v-else>{{ val }}</span>
                    </td>
                    </div>
                  </tr>
                </tbody>
              </table>

              <!-- Process Chemicals -->
              <details v-if="proc._chemicals && proc._chemicals.length" open class="inner-section">
                <summary class="inner-summary">Process Chemicals ({{ proc._chemicals.length }})</summary>
                <div class="inner-content">
                  <div v-for="(chem, ci) in proc._chemicals" :key="ci" class="nested-subsection">
                    <details open class="nested-details">
                      <summary class="nested-summary">Chemical #{{ ci + 1 }}</summary>
                      <div class="nested-content">
                        <table class="full-width-table">
                          <tbody>
                            <tr v-for="[cKey, cVal] in objectEntries(chem)" :key="cKey">
                              <td class="cell-key">{{ cKey }}</td>
                              <td class="cell-val">
                                <span v-if="cVal === null || cVal === undefined">—</span>
                                <span v-else>{{ cVal }}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                </div>
              </details>

              <!-- Process NAICS -->
              <details v-if="proc._naics && proc._naics.length" open class="inner-section">
                <summary class="inner-summary">NAICS Entries ({{ proc._naics.length }})</summary>
                <div class="inner-content">
                  <div v-for="(n, ni) in proc._naics" :key="ni" class="nested-subsection">
                    <details open class="nested-details">
                      <summary class="nested-summary">NAICS #{{ ni + 1 }}</summary>
                      <div class="nested-content">
                        <table class="full-width-table">
                          <tbody>
                            <tr v-for="[nKey, nVal] in objectEntries(n)" :key="nKey">
                              <div v-if="nKey !== '_prev_prog_3'">
                              <td class="cell-key">{{ nKey }}</td>
                              <td class="cell-val">
                                <span v-if="nVal === null || nVal === undefined">—</span>
                                <span v-else>{{ nVal }}</span>
                              </td>
                              </div>
                            </tr>
                          </tbody>
                        </table>

                        <!-- Prevention Programs Level 3 -->
                        <details v-if="n._prev_prog_3 && n._prev_prog_3.length" open class="inner-section">
                          <summary class="inner-summary">Prevention Programs Level 3 ({{ n._prev_prog_3.length }})</summary>
                          <div class="inner-content">
                            <div v-for="(pp3, ppi) in n._prev_prog_3" :key="ppi" class="nested-subsection">
                              <details open class="nested-details">
                                <summary class="nested-summary">Program #{{ ppi + 1 }}</summary>
                                <div class="nested-content">
                                  <table class="full-width-table">
                                    <tbody>
                                      <tr v-for="[ppKey, ppVal] in objectEntries(pp3)" :key="ppKey">
                                        <td class="cell-key">{{ ppKey }}</td>
                                        <td class="cell-val">
                                          <span v-if="ppVal === null || ppVal === undefined">—</span>
                                          <span v-else>{{ ppVal }}</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </details>
                            </div>
                          </div>
                        </details>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
            </div>
          </details>
        </div>
      </div>
    </details>

    <!-- Accidents -->
    <details v-if="accidents.length" id="accidentSection" class="section">
      <summary class="section-summary">Accidents ({{ accidents.length }})</summary>
      <div class="section-content">
        <div v-for="(acc, ai) in accidents" :key="ai" class="subsection">
          <details open class="subsection-details">
            <summary class="subsection-summary">Accident #{{ ai + 1 }}</summary>
            <div class="subsection-content">
              <table class="full-width-table">
                <tbody>
                  <tr v-for="[aKey, aVal] in objectEntries(acc)" :key="aKey" >
                    <div v-if="aKey !== '_chemicals'">
                    <td class="cell-key">{{ aKey }}</td>
                    <td class="cell-val">
                      <span v-if="aVal === null || aVal === undefined">—</span>
                      <span v-else>{{ aVal }}</span>
                    </td>
                    </div>
                  </tr>
                </tbody>
              </table>

              <!-- Accident Chemicals -->
              <details v-if="acc._chemicals && acc._chemicals.length" open class="inner-section">
                <summary class="inner-summary">Accident Chemicals ({{ acc._chemicals.length }})</summary>
                <div class="inner-content">
                  <div v-for="(ac, aci) in acc._chemicals" :key="aci" class="nested-subsection">
                    <details open class="nested-details">
                      <summary class="nested-summary">Chemical #{{ aci + 1 }}</summary>
                      <div class="nested-content">
                        <table class="full-width-table">
                          <tbody>
                            <tr v-for="[cKey, cVal] in objectEntries(ac)" :key="cKey">
                              <td class="cell-key">{{ cKey }}</td>
                              <td class="cell-val">
                                <span v-if="cVal === null || cVal === undefined">—</span>
                                <span v-else>{{ cVal }}</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                </div>
              </details>
            </div>
          </details>
        </div>
      </div>
    </details>

    <!-- Emergency Response -->
    <details v-if="emergResp" id="emergRespSection" class="section">
      <summary class="section-summary">Emergency Response</summary>
      <div class="section-content">
        <table class="full-width-table">
          <tbody>
            <tr v-for="[erKey, erVal] in objectEntries(emergResp)" :key="erKey">
              <td class="cell-key">{{ erKey }}</td>
              <td class="cell-val">
                <span v-if="erVal === null || erVal === undefined">—</span>
                <span v-else>{{ erVal }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <!-- Executive Summary -->
    <details v-if="execSummary.length" id="execSummarySection" class="section">
      <summary class="section-summary">Executive Summary ({{ execSummary.length }})</summary>
      <div class="section-content">
        <div v-for="(es, esi) in execSummary" :key="esi" class="subsection">
          <details open class="subsection-details">
            <summary class="subsection-summary">Summary #{{ esi + 1 }}</summary>
            <div class="subsection-content">
              <table class="full-width-table">
                <tbody>
                  <tr v-for="[esKey, esVal] in objectEntries(es)" :key="esKey">
                    <td class="cell-key">{{ esKey }}</td>
                    <td class="cell-val">
                      <div v-if="esVal === null || esVal === undefined">—</div>
                      <div v-else-if="esKey === 'SummaryText'">
                        <pre class="pre-block">{{ esVal }}</pre>
                      </div>
                      <div v-else>{{ esVal }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </details>
  </section>
</template>

<style scoped>
/* Container padding and max width */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Header styles */
.header {
  border-bottom: 2px solid #ccc;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.intro {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #555;
}

/* Navigation links */
.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.nav-links a {
  color: #005ea2;
  text-decoration: none;
  font-weight: 500;
}

.nav-links a:hover {
  text-decoration: underline;
}

/* Section and subsection styling */
.section {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  background-color: #fdfdfd;
}

.section-summary {
  background-color: #f0f4f8;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.section-content {
  padding: 1rem;
  border-top: 1px solid #ddd;
}

/* For nested subsections */
.subsection {
  margin-bottom: 1rem;
}

.subsection-details {
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fcfcfc;
  margin-bottom: 1rem;
}

.subsection-summary {
  padding: 0.5rem 0.75rem;
  background-color: #e6f1fa;
  cursor: pointer;
  font-weight: 600;
  color: #004f8a;
}

.subsection-content {
  padding: 0.75rem;
  border-top: 1px solid #ddd;
}

.inner-section {
  border: 1px solid #eee;
  border-radius: 4px;
  margin-top: 1rem;
  background-color: #fbfbfb;
}

.inner-summary {
  padding: 0.5rem 0.75rem;
  background-color: #eef5fb;
  cursor: pointer;
  font-weight: 600;
  color: #00457c;
}

.inner-content {
  padding: 0.75rem;
  border-top: 1px solid #ddd;
}

.nested-subsection {
  margin-bottom: 1rem;
}

.nested-details {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background-color: #fafafa;
}

.nested-summary {
  padding: 0.5rem 0.75rem;
  background-color: #f4f4f4;
  cursor: pointer;
  font-weight: 600;
  color: #333;
}

.nested-content {
  padding: 0.75rem;
  border-top: 1px solid #ddd;
}

/* Table full width & cell styling */
.full-width-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.full-width-table td {
  padding: 0.5rem;
  vertical-align: top;
  border-top: 1px solid #e1e1e1;
}

.cell-key {
  width: 25%;
  font-weight: 600;
  background-color: #f9f9f9;
  color: #1a1a1a;
}

.cell-val {
  width: 75%;
  color: #404040;
}

/* <pre> styling for summary text */
.pre-block {
  white-space: pre-wrap;
  background-color: #f4f4f4;
  padding: 0.75rem;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  color: #333;
}

/* Error text */
.error-text {
  color: #d91e18;
  font-weight: bold;
  padding: 1rem;
  background-color: #ffece8;
  border: 1px solid #f5c2c0;
  border-radius: 4px;
}
</style>
