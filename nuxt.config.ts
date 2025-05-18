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
  },
  nitro: {
    // expose ./data + ./db to Nitro (server) bundle
    // publicAssets: [{ dir: "data", maxAge: 60 }],
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
  build: {
    transpile: ['vue-uswds']
  },
  modules: [
    "@pinia/nuxt",
    [
      "nuxt-uswds",
      {
        autoImportBaseComponents: true,
        autoImportComponents: true,
      },
    ],
  ],
});
