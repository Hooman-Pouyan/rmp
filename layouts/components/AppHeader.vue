<script setup lang="ts">
// no props needed
</script>

<template>
  <header class="usa-header usa-header--basic">
    <div class="usa-nav-container">
      <div class="usa-navbar">
        <NuxtLink to="/" class="usa-logo" aria-label="Home">
          <em class="usa-logo__text">RMP Viewer</em>
        </NuxtLink>
        <button class="usa-menu-btn">Menu</button>
      </div>
      <nav class="usa-nav">
        <button class="usa-nav__close"><span class="usa-sr-only">close</span></button>
        <ul class="usa-nav__primary usa-accordion">
          <li class="usa-nav__primary-item">
            <NuxtLink to="/search" class="usa-nav__link">Search</NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* header-specific tweaks if needed */
</style>
