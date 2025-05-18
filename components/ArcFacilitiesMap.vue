<!-- components/ArcFacilitiesMap.vue -->
<template>
  <div ref="mapDiv" style="width:100%; height:600px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { FacilityLite } from '~/core/types/facility'

// Receive the array of filtered facilities (from your store)
const props = defineProps<{ facilities: FacilityLite[] }>()

const mapDiv = ref<HTMLDivElement>()
let view: __esri.MapView
let layer: __esri.GeoJSONLayer

/**
 * Apply the filter by EPA ID, then zoom/center to the result extent.
 */
async function applyFilter() {
  if (!layer || !view) return

  // Build an IN() expression of EPAFacilityID strings
  const ids = props.facilities.map(f => f.EPAFacilityID)
  const expr = ids.length
    ? `id IN (${ids.map(id => `'${id}'`).join(',')})`
    : ''  // empty => show all

  layer.definitionExpression = expr

  // Wait until the view is ready
  await view.when()

  // Query the extent of the filtered features
  // If expr is empty, we use "1=1" to get full extent
  const { extent } = await layer.queryExtent({ where: expr || '1=1' })

  // Zoom/center to that extent with a little padding
  view.goTo({ target: extent, padding: 50 })
}

onMounted(async () => {
  // Dynamically import ArcGIS modules in browser-only
  const [
    { default: Map },
    { default: MapView },
    { default: GeoJSONLayer }
  ] = await Promise.all([
    import('@arcgis/core/Map'),
    import('@arcgis/core/views/MapView'),
    import('@arcgis/core/layers/GeoJSONLayer')
  ])

  // 1️⃣ Create the map & view
  const map = new Map({ basemap: 'arcgis-topographic' })
  view = new MapView({
    container: mapDiv.value!,
    map,
    center: [-96, 37.8],
    zoom: 4
  })

  // 2️⃣ Create a GeoJSONLayer that loads all facilities
  layer = new GeoJSONLayer({
    url: '/api/facilities/geo',
    objectIdField: 'id',
    popupTemplate: {
      title: '{name}',
      content: event => {
        const p = event.graphic.attributes as any
        return `
          ${p.city}, ${p.state}<br>
          EPA ID: <a href="/facility/${p.id}">${p.id}</a><br>
          Last RMP: ${p.lastDate}<br>
          Accidents: ${p.accidents}
        `
      }
    },
    featureReduction: {
      type: 'cluster',
      clusterRadius: '60px',
      labelingInfo: [{
        deconflictionStrategy: 'none',
        labelExpressionInfo: { expression: 'Text($feature.cluster_count)' },
        symbol: {
          type: 'text',
          color: 'white',
          haloColor: 'black',
          haloSize: 1,
          font: { size: 12, weight: 'bold' }
        }
      }]
    },
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        color: '#0070f3',
        outline: { color: 'white', width: 0.5 },
        size: 8
      }
    }
  })

  // 3️⃣ Add it to the map
  map.add(layer)

  // 4️⃣ Initial filter/apply (shows all + zooms to full extent)
  applyFilter()
})

// 5️⃣ Re-apply whenever your search results change
watch(() => props.facilities, applyFilter, { deep: true })
</script>
