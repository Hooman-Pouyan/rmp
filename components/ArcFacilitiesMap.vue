<template>
    <div ref="mapDiv" style="width:100%; height:600px"></div>
</template>

<script setup lang="ts">
import '@arcgis/core/assets/esri/themes/light/main.css'
import { ref, onMounted, watch } from 'vue'
import type { FacilityLite }      from '~/core/types/facility'

const props = defineProps<{
  facilities : FacilityLite[]   // not touched here, layers load from /geo APIs
  focusIds   : string[]         // EPA IDs shown in the current table page
  showAll    : boolean          // ⇐ toggle from the Store
}>()

/* ————————————————————— internal handles ————————————————————— */
const mapDiv = ref<HTMLDivElement>()

let view        : __esri.MapView
let facIcons    : __esri.GeoJSONLayer
let subsBubbles : __esri.GeoJSONLayer
let progSquares : __esri.GeoJSONLayer
let accPoints   : __esri.GeoJSONLayer
let accHeat     : __esri.GeoJSONLayer

/* ———————————————————— initialise only once ———————————————————— */
async function initMap () {
  if (!process.client) return

  const [
    esriConfigMod, BasemapMod, BasemapStyleMod,
    MapMod, MapViewMod, GeoJSONLayerMod,
    LayerListMod, LegendMod, FullscreenMod, 
    // BasemapGalleryMod
  ] = await Promise.all([
    import('@arcgis/core/config.js'),
    import('@arcgis/core/Basemap.js'),
    import('@arcgis/core/support/BasemapStyle.js'),
    import('@arcgis/core/Map.js'),
    import('@arcgis/core/views/MapView.js'),
    import('@arcgis/core/layers/GeoJSONLayer.js'),
    import('@arcgis/core/widgets/LayerList.js'),
    import('@arcgis/core/widgets/Legend.js'),
    // import("@arcgis/core/widgets/BasemapGallery.js"),
    import("@arcgis/core/widgets/Fullscreen.js")
  ])

  const esriConfig   = esriConfigMod.default
  const Basemap      = BasemapMod.default
  const BasemapStyle = BasemapStyleMod.default
  const Map          = MapMod.default
  const MapView      = MapViewMod.default
  const GeoJSONLayer = GeoJSONLayerMod.default
  const LayerList    = LayerListMod.default
  const Legend       = LegendMod.default
  const Fullscreen       = FullscreenMod.default
  // const BasemapGallery       = BasemapGalleryMod.default


  

  esriConfig.apiKey = process.env.NUXT_PUBLIC_ESRI_API_KEY

  const map = new Map({
    basemap: new Basemap({
      style: new BasemapStyle({ id: "arcgis/hybrid", places: 'attributed' })
    })
  })

  view = new MapView({
    container: mapDiv.value!,
    map,
    center: [-96, 37.8],
    zoom  : 4
  })

  /* ————————————— layers ————————————— */

  facIcons = new GeoJSONLayer({
    id   : 'fac',
    url  : '/api/facilities/geo',
    title: 'Facilities',
    objectIdField: 'EPAFacilityID',
    popupTemplate: {
      title  : '{name}',
      content: `
        <strong>EPA ID:</strong> {EPAFacilityID}<br>
        <strong>Address:</strong> {address}, {city}, {state} {zipcode}<br>
        <strong>Parent:</strong> {parentCompany}<br>
        <strong>DUNS:</strong> {facilityDUNS}`
    },
    renderer: {
      type: 'simple',
      symbol: { type:'simple-marker', style:'circle',
                color:'#0070f3', size:8,
                outline:{ color:'white', width:0.5 } }
    },
    featureReduction: {
      type:'cluster',
      clusterRadius:'60px',
      labelingInfo:[{
        deconflictionStrategy:'none',
        labelExpressionInfo:{ expression:'Text($feature.cluster_count)' },
        symbol:{ type:'text', color:'white', haloColor:'black', haloSize:1,
                 font:{ size:12, weight:'bold' } }
      }]
    }
  })

  subsBubbles = new GeoJSONLayer({
    id:'subs',
    url:'/api/facilities/geo',
    title:'# Submissions',
    objectIdField:'EPAFacilityID',
    visible:false,
    popupEnabled:false,
    renderer:{
      type:'simple',
      symbol:{ type:'simple-marker', style:'circle', color:'#1D4ED8',
               outline:{ color:'white', width:0.5 } },
      visualVariables:[{
        type:'size', field:'subs',
        stops:[ {value:1,size:6},{value:5,size:16},{value:15,size:28} ]
      }]
    },
    featureReduction: facIcons.featureReduction   // identical clustering
  })

  progSquares = new GeoJSONLayer({
    id:'prog',
    url:'/api/facilities/geo',
    title:'Program Level',
    visible:false,
    renderer:{
      type:'unique-value', field:'pLevel',
      uniqueValueInfos:[
        { value:'1', label:'Program 1',
          symbol:{ type:'simple-marker', style:'square',
                   color:'#4ADE80', size:10 } },
        { value:'2', label:'Program 2',
          symbol:{ type:'simple-marker', style:'square',
                   color:'#FACC15', size:10 } },
        { value:'3', label:'Program 3',
          symbol:{ type:'simple-marker', style:'square',
                   color:'#F87171', size:10 } }
      ],
      defaultSymbol:{ type:'simple-marker', style:'square',
                      color:'#9CA3AF', size:8 },
      defaultLabel:'None / Unknown'
    }
  })

  accPoints = new GeoJSONLayer({
    id:'acc',
    url:'/api/accidents/geo',
    title:'Accidents',
    renderer:{
      type:'simple',
      symbol:{ type:'simple-marker', style:'circle',
               color:'#c82333', size:6,
               outline:{ color:'white', width:0.5 } }
    },
    popupTemplate:{
      title:'Accident #{id}',
      content:`
        <strong>Date:</strong> {accidentDate}<br>
        <strong>Time:</strong> {accidentTime}<br>
        <strong>NAICS:</strong> {naicsCode}<br>
        <strong>Duration:</strong> {releaseDuration}<br>
        <strong>Explosion:</strong> {reExplosion}<br>
        <strong>Fire:</strong> {reFire}<br>
        <a href='/accidents/{id}'>View detail</a>`
    }
  })

  accHeat = new GeoJSONLayer({
    id:'heat',
    url:'/api/accidents/geo',
    title:'Accident Heat',
    visible:true,
    popupEnabled:false,
    renderer:{
      type:'heatmap',
      colorStops:[
        { ratio:0,   color:'rgba(0,0,0,0)' },
        { ratio:0.2, color:'#FDE68A' },
        { ratio:0.4, color:'#FBBF24' },
        { ratio:0.7, color:'#F97316' },
        { ratio:1,   color:'#C2410C' }
      ]
    }
  })

  map.addMany([facIcons, subsBubbles, progSquares, accPoints, accHeat])
  
  view.ui.add(new Fullscreen({ view }), "top-left");  
  view.ui.add(new LayerList({ view }), 'bottom-right')

  await view.when()

  applyFilter()   // initial filter
  zoomToFocus()   // and zoom
}

/* ————————— helper: build & apply definitionExpression ————————— */
function applyFilter () {
  if (!facIcons) return

  if (props.showAll || !props.focusIds.length) {
    facIcons.definitionExpression  =
    subsBubbles.definitionExpression =
    progSquares.definitionExpression =
    accPoints.definitionExpression  =
    accHeat.definitionExpression    = null
    return
  }

  // Escaping single quotes for SQL-ish IN clause
  const list = props.focusIds.map(id => `'${id.replace(/'/g,"''")}'`).join(',')
  const expr = `EPAFacilityID IN (${list})`

  facIcons.definitionExpression  = expr
  subsBubbles.definitionExpression = expr
  progSquares.definitionExpression = expr
  accPoints.definitionExpression  = expr       // uses new EPAFacilityID property
  accHeat.definitionExpression    = expr
}

/* ————————— helper: zoom to current page ————————— */
async function zoomToFocus () {
  if (!facIcons || !view || !props.focusIds.length) return
  const list = props.focusIds.map(id => `'${id.replace(/'/g,"''")}'`).join(',')
  const { extent } = await facIcons.queryExtent({
    where: `EPAFacilityID IN (${list})`
  })
  if (extent) view.goTo({ target: extent, padding: 50 })
}

/* ————————— watchers ————————— */
onMounted(initMap)

watch(() => props.focusIds, () => {
  applyFilter()
  zoomToFocus()
}, { deep:true })

watch(() => props.showAll, applyFilter)
</script>

<style scoped>
/* ArcGIS CSS already imported */
</style>