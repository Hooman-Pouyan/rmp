<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="usa-footer usa-footer--slim">
    <div class="grid-row grid-gap">
      <div class="tablet:grid-col-4">
        <h2 class="usa-footer__title">Discover.</h2>
        <ul class="usa-list">
          <li><NuxtLink to="/accessibility">Accessibility</NuxtLink></li>
        </ul>
      </div>
      <div class="tablet:grid-col-4">
        <h2 class="usa-footer__title">Connect.</h2>
        <ul class="usa-list">
          <li><NuxtLink to="/data">Data</NuxtLink></li>
        </ul>
      </div>
      <div class="tablet:grid-col-4">
        <h2 class="usa-footer__title">Ask.</h2>
        <ul class="usa-list">
          <li><NuxtLink to="/contact">Contact EPA</NuxtLink></li>
        </ul>
      </div>
    </div>
    <div class="text-center margin-top-2 text-ink">© {{ year }} EPA</div>
  </footer>
</template>

<style scoped>
/* footer-specific tweaks if needed */
</style>
