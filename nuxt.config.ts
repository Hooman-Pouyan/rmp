import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ["./node_modules/@uswds/uswds/dist/css/uswds.min.css"],
  dir: {
    pages: "pages",
  },
  nitro: {
    // expose ./data + ./db to Nitro (server) bundle
    publicAssets: [{ dir: "data", maxAge: 60 }],
  },
  typescript: { strict: true },
  app: {
    head: { title: "Risk Management Plan Viewer" },
  },

  modules: ["@pinia/nuxt"],
});
