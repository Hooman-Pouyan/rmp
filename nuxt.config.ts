import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: [
    "~/assets/css/main.css",
    "./node_modules/uswds-vue/dist/uswds-vue.css",
    "./node_modules/@uswds/uswds/dist/css/uswds.css",
  ],
  dir: {
    pages: "pages",
    assets: "data",
  },
  nitro: {
    // expose ./data + ./db to Nitro (server) bundle
    publicAssets: [{ dir: "data", maxAge: 60 }],
    preset: 'vercel',
    output: {
       dir: 'output' // Adjust path if needed
    },
    // > Inline the optional pg-native module so Nitro stops complaining
    externals: {
      inline: ['pg-native']
    }
  },
  typescript: { strict: true },
  app: {
    head: { title: "Risk Management Plan Viewer" },
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss()],
  },
  plugins: [{ src: "~/plugins/arcgis.client.ts", mode: "client" }],
  runtimeConfig: {
    public: {
      esriApiKey: process.env.NUXT_PUBLIC_ESRI_API_KEY || "",
    },
  },

  build: {
    transpile: ["vue-uswds"],
  },
  modules: [
    "@pinia/nuxt",
    "nuxt-uswds"
  ],
});
