<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Solo mostrar header en rutas específicas (búsqueda) -->
    <AppHeader v-if="showHeader" />
    
    <!-- Main content sin sidebar -->
    <main class="mobile-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'

const route = useRoute()

// Solo mostrar header en ciertas rutas
const showHeader = computed(() => {
  const routesWithHeader = ['search']
  return routesWithHeader.includes(route.name)
})
</script>

<style scoped>
.mobile-main {
  width: 100%;
  min-height: 100vh;
}

/* Cuando hay header, agregar padding top */
.mobile-main:has(+ .has-header) {
  padding-top: 80px;
}
</style>