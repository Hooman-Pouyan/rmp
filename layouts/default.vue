<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

</script>

<template>
  <!-- USWDS official banner -->
  <!-- <section class="usa-banner relative" aria-label="Official government website">
    <div class="usa-banner__header">
      <div class="usa-banner__inner">
        <p class="usa-banner__header-text">
          An official website of the United States government
        </p>
      </div>
    </div>
  </section> -->

  <AppHeader />

  <main id="main-content" class="bg-base-lightest px-5">
    <slot />
  </main>

  <AppFooter />
</template>

<style scoped>
/* tweak the main content background */
.bg-base-lightest {
  background: var(--usa-base-lightest);
}
</style>
