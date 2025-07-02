<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-900">Buscar Series</h1>
    </div>

    <div class="max-w-2xl">
      <div class="relative">
        <Search class="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          v-model="q"
          @input="onInput"
          @keyup.enter="doSearch"
          type="text"
          placeholder="Buscar series por nombre..."
          class="input pl-10 text-lg py-3 w-full"
        />
      </div>
    </div>

    <div v-if="store.loading" class="text-center">
      <LoadingSpinner size="lg"/>
    </div>

    <div v-else-if="store.searchResults.length > 0">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">
          Resultados ({{ store.searchResults.length }})
        </h2>
        <button @click="clear" class="text-sm text-gray-500 hover:text-gray-700">
          Limpiar búsqueda
        </button>
      </div>
      <SeriesGrid :series="store.searchResults"/>
    </div>

    <div v-else-if="q && !store.loading" class="text-center py-12">
      <Search class="mx-auto h-12 w-12 text-gray-400 mb-4"/>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
      <p class="text-gray-600">Prueba con otro nombre</p>
    </div>

    <div v-else class="text-center py-12">
      <Search class="mx-auto h-12 w-12 text-gray-400 mb-4"/>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Busca tus series favoritas</h3>
      <p class="text-gray-600">Ingresa un término para comenzar</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import SeriesGrid     from '@/components/SeriesGrid.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useSeriesStore } from '@/stores/series'

const store = useSeriesStore()
const q     = ref('')

let debounceTimeout = null
function onInput() {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    doSearch()
  }, 300)
}

function doSearch() {
  store.searchSeries(q.value)
}

function clear() {
  q.value = ''
  store.clearSearch()
}
</script>
