<template>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search class="h-5 w-5 text-gray-400" />
    </div>
    <input
      v-model="searchQuery"
      @input="handleSearch"
      @keyup.enter="performSearch"
      type="text"
      placeholder="Buscar series..."
      class="input pl-10 pr-4"
    />
    <div v-if="searchQuery && searchResults.length > 0" 
         class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
      <div
        v-for="series in searchResults.slice(0, 5)"
        :key="series.id"
        @click="selectSeries(series)"
        class="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
      >
        <img
          v-if="series.poster"
          :src="series.poster"
          :alt="series.name"
          class="w-10 h-15 object-cover rounded mr-3"
        />
        <div>
          <p class="text-sm font-medium text-gray-900">{{ series.name }}</p>
          <p class="text-xs text-gray-500">{{ series.year }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useSeriesStore } from '@/stores/series'

const router = useRouter()
const seriesStore = useSeriesStore()

const searchQuery = ref('')
const searchResults = ref([])

let searchTimeout = null

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      await seriesStore.searchSeries(searchQuery.value)
      searchResults.value = seriesStore.searchResults
    } else {
      searchResults.value = []
    }
  }, 300)
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: 'search', query: { q: searchQuery.value } })
    searchResults.value = []
  }
}

const selectSeries = (series) => {
  router.push({ name: 'series-detail', params: { id: series.id } })
  searchQuery.value = ''
  searchResults.value = []
}
</script>