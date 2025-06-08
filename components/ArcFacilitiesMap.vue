<template>
  <client-only>
    <div ref="mapDiv" style="width:100%; height:600px"></div>
  </client-only>
</template>

<script setup lang="ts">
import '@arcgis/core/assets/esri/themes/light/main.css'    // ← ArcGIS CSS

import { ref, onMounted, watch } from 'vue'
import type { FacilityLite } from '~/core/types/facility'

const props = defineProps<{
  facilities: FacilityLite[]
  focusIds:   string[]
}>()

const mapDiv = ref<HTMLDivElement>()

let view:        __esri.MapView
let facIcons:    __esri.GeoJSONLayer
let subsBubbles: __esri.GeoJSONLayer
let accHeat:     __esri.GeoJSONLayer
let progSquares: __esri.GeoJSONLayer

async function initMap() {
  if (!process.client) return

  // load ArcGIS modules (including config & basemap/style)
  const [
    esriConfigMod,
    BasemapMod,
    BasemapStyleMod,
    MapMod,
    MapViewMod,
    GeoJSONLayerMod,
    LayerListMod,
    LegendMod
  ] = await Promise.all([
    import('@arcgis/core/config.js'),
    import('@arcgis/core/Basemap.js'),
    import('@arcgis/core/support/BasemapStyle.js'),
    import('@arcgis/core/Map.js'),
    import('@arcgis/core/views/MapView.js'),
    import('@arcgis/core/layers/GeoJSONLayer.js'),
    import('@arcgis/core/widgets/LayerList.js'),
    import('@arcgis/core/widgets/Legend.js'),
  ])

  const esriConfig    = esriConfigMod.default
  const Basemap       = BasemapMod.default
  const BasemapStyle  = BasemapStyleMod.default
  const Map           = MapMod.default
  const MapView       = MapViewMod.default
  const GeoJSONLayer  = GeoJSONLayerMod.default
  const LayerList     = LayerListMod.default
  const Legend        = LegendMod.default

  // use your API key (no sign-in popup)
  esriConfig.apiKey = process.env.NUXT_PUBLIC_ESRI_API_KEY

  // create the map with the ArcGIS navigation basemap
  const map = new Map({
    basemap: new Basemap({
      style: new BasemapStyle({ id:'arcgis/navigation', places:'attributed' })
    })
  })


  view = new MapView({
    container: mapDiv.value!,
    map,
    center: [-96, 37.8],
    zoom: 4
  })

  // ———————————— your GeoJSON layers ————————————

   // 2) Accidents layer: simple red circles
 const accPoints = new GeoJSONLayer({
   id: 'acc',
   url: '/api/accidents/geo',
   title: 'Accidents',
   renderer: {
     type: 'simple',
     symbol: {
       type: 'simple-marker',
       style: 'circle',
       color: '#c82333',
       size: 6,
       outline: { color: 'white', width: 0.5 }
     }
   },
   popupTemplate: {
    title: "Accident #{id}",
    content: `
    <strong>Date:</strong> {accidentDate}<br>
    <strong>Time:</strong> {accidentTime}<br>
    <strong>NAICS:</strong> {naicsCode}<br>
    <strong>Duration:</strong> {releaseDuration}<br>
    <strong>Explosion:</strong> {reExplosion}<br>
    <strong>Fire:</strong> {reFire}<br>
    <strong>Event:</strong> {initiatingEvent}<br>
    <a href="/accidents/{id}">View detail</a>
  `
}
 })
 map.add(accPoints)



  facIcons = new GeoJSONLayer({
    id: 'fac',
    url: '/api/facilities/geo',
    title: 'Facilities',
    objectIdField: 'id',
    popupTemplate: {
      title: "{name}",
      content: `
    <strong>EPA ID:</strong> {EPAFacilityID}<br>
    <strong>Address:</strong> {address}, {city}, {state} {zipcode}<br>
    <strong>Parent:</strong> {parentCompany}<br>
    <strong>DUNS:</strong> {facilityDUNS}<br>
    <strong>Company2:</strong> {company_2}<br>
    <strong>County FIPS:</strong> {county_fips}<br>
    <strong>Submission Type:</strong> {submissionType}<br>
    <!-- any other {field} you added in your properties -->
  `
},
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        color: '#0070f3',
        size: 8,
        outline: { color: 'white', width: 0.5 }
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
    }
  })

  subsBubbles = new GeoJSONLayer({
    id: 'subs',
    url: '/api/facilities/geo',
    title: '# Submissions',
    objectIdField: 'id',
    visible: false,
    popupEnabled: false,
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        color: '#1D4ED8',
        outline: { color: 'white', width: 0.5 }
      },
      visualVariables: [{
        type: 'size',
        field: 'subs',
        stops: [
          { value: 1, size: 6 },
          { value: 5, size: 16 },
          { value: 15, size: 28 }
        ]
      }]
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
    }
  })

  accHeat = new GeoJSONLayer({
    id: 'heat',
    url: '/api/facilities/geo',
    title: 'Accident Heat',
    visible: false,
    popupEnabled: false,
    renderer: {
      type: 'heatmap',
      field: 'acc',
      colorStops: [
        { ratio: 0,   color: 'rgba(0,0,0,0)' },
        { ratio: 0.2, color: '#FDE68A' },
        { ratio: 0.4, color: '#FBBF24' },
        { ratio: 0.7, color: '#F97316' },
        { ratio: 1,   color: '#C2410C' }
      ],
      maxPixelIntensity: 10,
      minPixelIntensity: 1
    }
  })

  progSquares = new GeoJSONLayer({
    id: 'prog',
    url: '/api/facilities/geo',
    title: 'Program Level',
    visible: false,
    popupEnabled: false,
    renderer: {
      type: 'unique-value',
      field: 'pLevel',
      uniqueValueInfos: [
        {
          value: '1', label: 'Program 1',
          symbol: { type: 'simple-marker', style: 'square', color: '#4ADE80', size: 10 }
        },
        {
          value: '2', label: 'Program 2',
          symbol: { type: 'simple-marker', style: 'square', color: '#FACC15', size: 10 }
        },
        {
          value: '3', label: 'Program 3',
          symbol: { type: 'simple-marker', style: 'square', color: '#F87171', size: 10 }
        }
      ],
      defaultSymbol: { type: 'simple-marker', style: 'square', color: '#9CA3AF', size: 8 },
      defaultLabel: 'None / Unknown'
    }
  })

  map.addMany([facIcons, subsBubbles, accHeat, progSquares])

  const layerList = new LayerList({ view })
  const legend    = new Legend({ view })
  view.ui.add(layerList, 'top-right')
  view.ui.add(legend,    'bottom-left')

  await view.when()
  zoomToFocus()
}

async function zoomToFocus() {
  if (!facIcons || !view) return
  const ids = props.focusIds
  if (!ids.length) return
  const where = `id IN (${ids.map(id => `'${id}'`).join(',')})`
  const { extent } = await facIcons.queryExtent({ where })
  view.goTo({ target: extent, padding: 50 })
}

onMounted(initMap)
watch(() => props.focusIds, zoomToFocus, { deep: true })
</script>

<style scoped>
/* nothing extra needed—ArcGIS CDN CSS handles it */
</style>