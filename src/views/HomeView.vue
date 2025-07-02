<template>
  <div class="space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Bienvenido a TV Tracker
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Descubre, rastrea y organiza tus series favoritas
      </p>
    </div>

    <div v-if="store.loading" class="text-center">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else-if="store.trendingSeries.length > 0">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Series Populares</h2>
      <SeriesGrid :series="store.trendingSeries" />
    </div>

    <div v-else class="text-center py-12">
      <Tv class="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No se pudieron cargar las series</h3>
      <p class="text-gray-600">Intenta refrescar la página o buscar series específicas</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted }    from 'vue'
import { Tv }           from 'lucide-vue-next'
import SeriesGrid       from '@/components/SeriesGrid.vue'
import LoadingSpinner   from '@/components/LoadingSpinner.vue'
import { useSeriesStore } from '@/stores/series'

const store = useSeriesStore()

onMounted(() => {
  store.fetchTrendingSeries()
})
</script>
