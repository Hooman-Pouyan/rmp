<template>
  <!-- wraps in client-only so SSR never even tries to render it -->
  <client-only>
    <div ref="mapDiv" style="width:100%; height:600px;"></div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { FacilityLite } from '~/core/types/facility'

// receive the filtered facilities array
const props = defineProps<{ facilities: FacilityLite[] }>()

// a ref to our <div>
const mapDiv = ref<HTMLDivElement>()

// placeholders for view & layer
let view: __esri.MapView
let layer: __esri.GeoJSONLayer

async function initMap() {
  // only run in browser
  if (!process.client) return

  // dynamic imports
  const [
    EsriConfig,
    Basemap,
    BasemapStyle,
    Map,
    MapView,
    GeoJSONLayer
  ] = await Promise.all([
    import('@arcgis/core/config.js'),
    import('@arcgis/core/Basemap.js'),
    import('@arcgis/core/support/BasemapStyle.js'),
    import('@arcgis/core/Map.js'),
    import('@arcgis/core/views/MapView.js'),
    import('@arcgis/core/layers/GeoJSONLayer.js')
  ])

  // sets API key
  EsriConfig.default.apiKey = process.env.NUXT_PUBLIC_ESRI_API_KEY

  // builds a navigation basemap style
  const basemap = new Basemap.default({
    style: new BasemapStyle.default({
      id: 'arcgis/navigation',
      places: 'attributed'
    })
  })

  // create the map + view
  const map = new Map.default({ basemap })
  view = new MapView.default({
    container: mapDiv.value!,
    map,
    center: [-96, 37.8],
    zoom: 4
  })

  // loads facilities GeoJSON and clusters it
  layer = new GeoJSONLayer.default({
    url: '/api/facilities/geo',     
    objectIdField: 'id',
    popupTemplate: {
      title: '{name}',
      content: (event: any) => {
        const p = event.graphic.attributes as any
        return `
          <strong>${p.name}</strong><br>
          ${p.city}, ${p.state}<br>
          EPA ID:
            <a href="/facility/${p.id}">
              ${p.id}
            </a><br>
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

  map.add(layer)

  // once map & layer are ready, apply initial filter + zoom
  await view.when()
  applyFilter()
}

// builds the SQL WHERE for your EPA IDs, re-queries extent, zooms
async function applyFilter() {
  if (!layer || !view) return

  const ids = props.facilities.map((f) => f.EPAFacilityID)
  layer.definitionExpression = ids.length
    ? `id IN (${ids.map((id) => `'${id}'`).join(',')})`
    : ''
    
  if (ids.length) {
    layer.definitionExpression = `id IN (${ids.map((id) => `'${id}'`).join(',')})`
  } else {
    // “1=1” forces no filter → show all features
    layer.definitionExpression = "1=1"
  }

  await view.when()
  const { extent } = await layer.queryExtent({ where: layer.definitionExpression || '1=1' })
  view.goTo({ target: extent, padding: 50 })
}

// only run once, on client
onMounted(initMap)

// re-apply whenever parent’s filtered facilities change
watch(() => props.facilities, applyFilter, { deep: true })
</script>
