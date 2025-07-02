import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import tursoDb from '@/services/tursoDb'
import localStorageService from '@/services/localStorage'
import { useAuthStore } from './auth'

export const useWatchedStore = defineStore('watched', () => {
  const watchedEpisodes = ref([])
  const loading = ref(false)

  const watchedSeries = computed(() => {
    const seriesMap = new Map()
    watchedEpisodes.value.forEach(episode => {
      if (!seriesMap.has(episode.series_id)) {
        seriesMap.set(episode.series_id, {
          series_id: episode.series_id,
          series_name: episode.series_name,
          episodes: [],
          lastWatched: episode.watched_at
        })
      }
      seriesMap.get(episode.series_id).episodes.push(episode)
      
      // Actualizar última fecha si es más reciente
      const currentSeries = seriesMap.get(episode.series_id)
      if (new Date(episode.watched_at) > new Date(currentSeries.lastWatched)) {
        currentSeries.lastWatched = episode.watched_at
      }
    })
    return Array.from(seriesMap.values())
  })

  const loadWatchedEpisodes = async () => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      watchedEpisodes.value = []
      return
    }

    loading.value = true
    try {
      const episodes = await tursoDb.getWatchedEpisodes(authStore.user.id)
      watchedEpisodes.value = episodes.map(ep => ({
        id: ep.id,
        series_id: ep.series_id,
        episode_id: ep.episode_id,
        series_name: ep.series_name,
        episode_name: ep.episode_name,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        watched_at: ep.watched_at
      }))
      
      localStorageService.setItem('watchedEpisodes', watchedEpisodes.value)
    } catch (error) {
      console.error('Error loading watched episodes from DB:', error)
      
      // Fallback to localStorage
      const savedWatched = localStorageService.getItem('watchedEpisodes')
      if (savedWatched) {
        watchedEpisodes.value = savedWatched
      }
    } finally {
      loading.value = false
    }
  }

  const markAsWatched = async (episode, series) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    // Verificar si ya está marcado como visto
    if (isEpisodeWatched(episode.id)) {
      return
    }

    try {
      await tursoDb.markAsWatched(
        authStore.user.id,
        series.id,
        episode.id,
        series.name,
        episode.name,
        episode.seasonNumber,
        episode.number
      )
      
      // Agregar al array local
      const newWatchedEpisode = {
        id: Date.now(), // ID temporal hasta que se sincronice con DB
        series_id: series.id,
        episode_id: episode.id,
        series_name: series.name,
        episode_name: episode.name,
        season_number: episode.seasonNumber,
        episode_number: episode.number,
        watched_at: new Date().toISOString()
      }
      
      watchedEpisodes.value.push(newWatchedEpisode)
      localStorageService.setItem('watchedEpisodes', watchedEpisodes.value)
    } catch (error) {
      console.error('Error marking episode as watched:', error)
      throw error
    }
  }

  const markAsUnwatched = async (episodeId) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      // Encontrar el episodio en la lista local
      const watchedEpisode = watchedEpisodes.value.find(ep => ep.episode_id === episodeId)
      if (!watchedEpisode) return

      // Remover de la base de datos (necesitarías agregar este método en tursoDb)
      // await tursoDb.removeWatchedEpisode(authStore.user.id, episodeId)
      
      // Remover del array local
      watchedEpisodes.value = watchedEpisodes.value.filter(ep => ep.episode_id !== episodeId)
      localStorageService.setItem('watchedEpisodes', watchedEpisodes.value)
    } catch (error) {
      console.error('Error unmarking episode as watched:', error)
      throw error
    }
  }

  const isEpisodeWatched = (episodeId) => {
    return watchedEpisodes.value.some(ep => ep.episode_id == episodeId)
  }

  const isSeriesCompletelyWatched = (seriesId, totalEpisodes = null) => {
    const seriesEpisodes = watchedEpisodes.value.filter(ep => ep.series_id == seriesId)
    if (totalEpisodes) {
      return seriesEpisodes.length >= totalEpisodes
    }
    return seriesEpisodes.length > 0
  }

  const getWatchedEpisodesForSeries = (seriesId) => {
    return watchedEpisodes.value.filter(ep => ep.series_id == seriesId)
  }

  const clearWatchedEpisodes = () => {
    watchedEpisodes.value = []
    localStorageService.removeItem('watchedEpisodes')
  }

  return {
    watchedEpisodes,
    watchedSeries,
    loading,
    loadWatchedEpisodes,
    markAsWatched,
    markAsUnwatched,
    isEpisodeWatched,
    isSeriesCompletelyWatched,
    getWatchedEpisodesForSeries,
    clearWatchedEpisodes
  }
})