<!-- components/ArcFacilitiesMap.vue -->
<template>
  <div ref="mapDiv" style="height: 600px;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// reference to the map container
const mapDiv = ref<HTMLDivElement>()

onMounted(async () => {
  // dynamically import ArcGIS modules in the browser
  const [
    { default: Map },
    { default: MapView },
    { default: GeoJSONLayer }
  ] = await Promise.all([
    import('@arcgis/core/Map'),
    import('@arcgis/core/views/MapView'),
    import('@arcgis/core/layers/GeoJSONLayer')
  ])

  // create the ArcGIS Map
  const map = new Map({
    basemap: 'arcgis-topographic'
  })

  // create a GeoJSONLayer pointing to our API endpoint
  const layer = new GeoJSONLayer({
    url: '/api/facilities/geo',
    featureReduction: {
      type: 'cluster',
      clusterRadius: '60px',
      labelingInfo: [
        {
          deconflictionStrategy: 'none',
          labelExpressionInfo: { expression: 'Text($feature.cluster_count)' },
          symbol: {
            type: 'text',
            color: 'white',
            haloColor: 'black',
            haloSize: 1,
            font: { size: 12, weight: 'bold' }
          }
        }
      ]
    },
    popupTemplate: {
      title: '{name}',
      content: (event: any) => {
        const p = event.graphic.attributes
        return `
          ${p.city}, ${p.state}<br>
          EPA ID: <a href="/facility/${p.id}">${p.id}</a><br>
          Last RMP: ${p.lastDate}<br>
          Accidents: ${p.accidents}
        `
      }
    }
  })

  // add the layer to the map
  map.add(layer)

  // create the view
  new MapView({
    container: mapDiv.value!,
    map,
    center: [-96, 37.8],
    zoom: 4
  })
})
</script>
