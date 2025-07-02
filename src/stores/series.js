// src/stores/series.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import tvdbApi from '@/services/tvdbApi'

export const useSeriesStore = defineStore('series', () => {
  const searchResults   = ref([])
  const trendingSeries  = ref([])
  const loading         = ref(false)
  const error           = ref(null)

  // Trae y formatea las series populares con detalle (incluye poster)
  async function fetchTrendingSeries() {
    loading.value = true
    error.value   = null
    try {
      const raw = await tvdbApi.getTrendingSeries()
      // ahora pedimos cada detalle por ID para tener el poster
      const detailed = await Promise.all(
        raw.map(item => tvdbApi.getSeriesById(item.id))
      )
      trendingSeries.value = detailed
    } catch (err) {
      console.error('Error fetching trending:', err)
      error.value = 'No se pudo cargar series populares'
    } finally {
      loading.value = false
    }
  }

  // Busca y formatea resultados (incluye poster)
  async function searchSeries(query) {
    if (!query.trim()) {
      searchResults.value = []
      return
    }
    loading.value = true
    error.value   = null
    try {
      const raw = await tvdbApi.searchSeries(query)
      // cada resultado puede no traer .image completo, pero our format usa getImageUrl
      searchResults.value = raw.map(item => tvdbApi.formatSeriesData(item))
    } catch (err) {
      console.error('Error searching series:', err)
      error.value = 'Error buscando series'
    } finally {
      loading.value = false
    }
  }

  function clearSearch() {
    searchResults.value = []
  }

  return {
    searchResults,
    trendingSeries,
    loading,
    error,
    fetchTrendingSeries,
    searchSeries,
    clearSearch
  }
})
