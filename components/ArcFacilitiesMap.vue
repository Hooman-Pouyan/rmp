<template>
  <client-only>
    <div ref="mapDiv" style="width:100%; height:600px"></div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { FacilityLite } from '~/core/types/facility'

const props = defineProps<{
  facilities: FacilityLite[]
  focusIds:   string[]
}>()

const mapDiv = ref<HTMLDivElement>()

/* ArcGIS handles */
let view:           __esri.MapView
let facIcons:       __esri.GeoJSONLayer
let subsBubbles:    __esri.GeoJSONLayer
let accHeat:        __esri.GeoJSONLayer
let progSquares:    __esri.GeoJSONLayer

/* ---------------- init ----------------------------------------------- */
async function initMap () {
  if (!process.client) return

  const [
    esriConfig, Basemap, BasemapStyle, Map, MapView, GeoJSONLayer,
    LayerList, Legend
  ] = await Promise.all([
    import('@arcgis/core/config.js'),
    import('@arcgis/core/Basemap.js'),
    import('@arcgis/core/support/BasemapStyle.js'),
    import('@arcgis/core/Map.js'),
    import('@arcgis/core/views/MapView.js'),
    import('@arcgis/core/layers/GeoJSONLayer.js'),
    import('@arcgis/core/widgets/LayerList.js'),
    import('@arcgis/core/widgets/Legend.js')
  ])

  esriConfig.default.apiKey = process.env.NUXT_PUBLIC_ESRI_API_KEY

  const map = new Map.default({
    basemap: new Basemap.default({
      style: new BasemapStyle.default({ id:'arcgis/navigation', places:'attributed' })
    })
  })
  view = new MapView.default({ container: mapDiv.value!, map, center:[-96,37.8], zoom:4 })

  /* ---------- layer 1: simple blue circle icons -------------------- */
  facIcons = new GeoJSONLayer.default({
    id:'fac', url:'/api/facilities/geo', title:'Facilities',
    objectIdField:'id',
    popupTemplate:{
      title:'{name}',
      content: ({graphic}) => {
        const p=graphic.attributes as any
        return `<strong>${p.name}</strong><br>${p.city}, ${p.state}<br>
                EPA ID: <a href="/facility/${p.id}">${p.id}</a><br>
                Submissions: ${p.subs}<br>
                Accidents: ${p.acc}`
      }
    },
    renderer:{
      type:'simple',
      symbol:{
        type:'simple-marker', style:'circle',
        color:'#0070f3', size:8,
        outline:{ color:'white', width:0.5 }
      }
    },
    featureReduction:{
      type:'cluster',
      clusterRadius:'60px',
      labelingInfo:[{
        deconflictionStrategy:'none',
        labelExpressionInfo:{ expression:'Text($feature.cluster_count)' },
        symbol:{
          type:'text', color:'white', haloColor:'black', haloSize:1,
          font:{ size:12, weight:'bold' }
        }
      }]
    }
  })

  /* ---------- layer 2: submission bubbles (with clustering) -------- */
  subsBubbles = new GeoJSONLayer.default({
    id:'subs', url:'/api/facilities/geo', title:'# Submissions',
    objectIdField:'id', visible:false, popupEnabled:false,
    renderer:{
      type:'simple',
      symbol:{ type:'simple-marker', style:'circle', color:'#1D4ED8',
               outline:{ color:'white', width:0.5 } },
      visualVariables:[{
        type:'size', field:'subs',
        stops:[ {value:1,size:6}, {value:5,size:16}, {value:15,size:28} ]
      }]
    },
    featureReduction:{
      type:'cluster',
      clusterRadius:'60px',
      labelingInfo:[{
        deconflictionStrategy:'none',
        labelExpressionInfo:{ expression:'Text($feature.cluster_count)' },
        symbol:{
          type:'text', color:'white', haloColor:'black', haloSize:1,
          font:{ size:12, weight:'bold' }
        }
      }]
    }
  })

  /* ---------- layer 3: accident heatmap ---------------------------- */
  accHeat = new GeoJSONLayer.default({
    id:'heat', url:'/api/facilities/geo', title:'Accident Heat',
    visible:false, popupEnabled:false,
    renderer:{
      type:'heatmap', field:'acc',
      colorStops:[
        {ratio:0,  color:'rgba(0,0,0,0)'},
        {ratio:0.2,color:'#FDE68A'},
        {ratio:0.4,color:'#FBBF24'},
        {ratio:0.7,color:'#F97316'},
        {ratio:1,  color:'#C2410C'}
      ],
      maxPixelIntensity:10,
      minPixelIntensity:1
    }
  })

  /* ---------- layer 4: highest Program Level squares --------------- */
  progSquares = new GeoJSONLayer.default({
    id:'prog', url:'/api/facilities/geo', title:'Program Level',
    visible:false, popupEnabled:false,
    renderer:{
      type:'unique-value', field:'pLevel',
      uniqueValueInfos:[
        { value:'1', label:'Program 1',
          symbol:{ type:'simple-marker', style:'square', color:'#4ADE80', size:10 } },
        { value:'2', label:'Program 2',
          symbol:{ type:'simple-marker', style:'square', color:'#FACC15', size:10 } },
        { value:'3', label:'Program 3',
          symbol:{ type:'simple-marker', style:'square', color:'#F87171', size:10 } }
      ],
      defaultSymbol:{ type:'simple-marker', style:'square', color:'#9CA3AF', size:8 },
      defaultLabel:'None / Unknown'
    }
  })
  

  console.log({progSquares})

  map.addMany([facIcons, subsBubbles, accHeat, progSquares])

  /* widgets */
  const layerList = new LayerList.default({ view })
  const legend    = new Legend.default({ view })
  view.ui.add(layerList, 'top-right')
  view.ui.add(legend,    'bottom-left')

  await view.when()
  zoomToFocus()
}

/* ---- helper: zoom to IDs of current table page ------------------------- */
async function zoomToFocus () {
  if (!facIcons || !view) return
  const ids = props.focusIds
  if (!ids.length) return
  const where = `id IN (${ids.map(id=>`'${id}'`).join(',')})`
  const { extent } = await facIcons.queryExtent({ where })
  view.goTo({ target: extent, padding:50 })
}

onMounted(initMap)
watch(() => props.focusIds, zoomToFocus, { deep:true })
</script>