// plugins/arcgis.client.ts
import "@arcgis/core/assets/esri/themes/light/main.css";
import esriConfig from "@arcgis/core/config";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin(() => {
  // Supply your free ArcGIS Developer API key via .env
  (esriConfig as any).apiKey = useRuntimeConfig().public.esriApiKey;
});
