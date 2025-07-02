<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <div class="flex">
      <AppNavigation />
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue'
import AppNavigation from './AppNavigation.vue'
</script>