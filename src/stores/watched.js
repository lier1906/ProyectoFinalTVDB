import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import tursoDb from '@/services/tursoDb'
import localStorageService from '@/services/localStorage'
import { useAuthStore } from './auth'

export const useWatchedStore = defineStore('watched', () => {
  const watchedEpisodes = ref([])
  const loading = ref(false)

 // En watched.js store, actualiza el computed watchedSeries:

const watchedSeries = computed(() => {
  console.log('🔍 Computing watchedSeries from:', watchedEpisodes.value.length, 'episodes')
  
  const seriesMap = new Map()
  const moviesArray = []
  
  watchedEpisodes.value.forEach(episode => {
    console.log('📺 Processing episode:', episode)
    
    // Si es película
    if (episode.is_movie || episode.episode_id?.startsWith('movie_')) {
      moviesArray.push({
        id: episode.series_id,
        name: episode.series_name,
        type: 'movie',
        watched_at: episode.watched_at,
        poster_url: episode.poster_url, // Incluir poster
        series_id: episode.series_id
      })
    } else {
      // Es serie normal
      if (!seriesMap.has(episode.series_id)) {
        seriesMap.set(episode.series_id, {
          series_id: episode.series_id,
          series_name: episode.series_name,
          type: 'series',
          episodes: [],
          lastWatched: episode.watched_at,
          poster_url: episode.poster_url // Incluir poster
        })
      }
      
      const currentSeries = seriesMap.get(episode.series_id)
      currentSeries.episodes.push(episode)
      
      // Actualizar poster si no existe
      if (!currentSeries.poster_url && episode.poster_url) {
        currentSeries.poster_url = episode.poster_url
      }
      
      // Actualizar última fecha si es más reciente
      if (new Date(episode.watched_at) > new Date(currentSeries.lastWatched)) {
        currentSeries.lastWatched = episode.watched_at
      }
    }
  })
  
  const result = [
    ...Array.from(seriesMap.values()),
    ...moviesArray
  ]
  
  console.log('✅ watchedSeries computed result:', result)
  return result
})

  const loadWatchedEpisodes = async () => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      watchedEpisodes.value = []
      return
    }

    loading.value = true
    try {
      console.log('🔄 Loading watched episodes from DB...')
      const episodes = await tursoDb.getWatchedEpisodes(authStore.user.id)
      console.log('📥 Loaded episodes from DB:', episodes)
      
      watchedEpisodes.value = episodes.map(ep => ({
        id: ep.id,
        series_id: ep.series_id,
        episode_id: ep.episode_id,
        series_name: ep.series_name,
        episode_name: ep.episode_name,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        poster_url: ep.poster_url,
        watched_at: ep.watched_at,
        is_movie: ep.is_movie || ep.episode_id?.startsWith('movie_') || false
      }))
      
      console.log('✅ Processed watched episodes:', watchedEpisodes.value)
      localStorageService.setItem('watchedEpisodes', watchedEpisodes.value)
    } catch (error) {
      console.error('❌ Error loading watched episodes from DB:', error)
      
      // Fallback to localStorage
      const savedWatched = localStorageService.getItem('watchedEpisodes')
      if (savedWatched) {
        watchedEpisodes.value = savedWatched
        console.log('📱 Loaded from localStorage:', savedWatched)
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
      console.log('⚠️ Episode already watched:', episode.id)
      return
    }

    try {
      console.log('🔥 Marking episode as watched:', { episode, series })
      
      await tursoDb.markAsWatched(
        authStore.user.id,
        series.id,
        episode.id,
        series.name,
        episode.name,
        episode.seasonNumber || episode.season_number || 1,
        episode.number || episode.episode_number || 1,
        series.poster || series.image || null // Agregar poster
      )
      
      // Agregar al array local
      const newWatchedEpisode = {
        id: Date.now(), // ID temporal hasta que se sincronice con DB
        series_id: series.id,
        episode_id: episode.id,
        series_name: series.name,
        episode_name: episode.name,
        season_number: episode.seasonNumber || episode.season_number || 1,
        episode_number: episode.number || episode.episode_number || 1,
        poster_url: series.poster || series.image || null, // Agregar poster
        watched_at: new Date().toISOString(),
        is_movie: false
      }
      
      watchedEpisodes.value.push(newWatchedEpisode)
      localStorageService.setItem('watchedEpisodes', watchedEpisodes.value)
      console.log('✅ Episode marked as watched successfully')
    } catch (error) {
      console.error('❌ Error marking episode as watched:', error)
      throw error
    }
  }

  // Marcar película como vista
  const markMovieAsWatched = async (movie) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    if (isMovieWatched(movie.id)) {
      console.log('⚠️ Movie already watched:', movie.id)
      return
    }

    try {
      console.log('🎬 Marking movie as watched:', movie)
      
      // Usar el mismo sistema de episodes pero con datos de película
      await tursoDb.markAsWatched(
        authStore.user.id,
        movie.id,
        `movie_${movie.id}`, // ID único para película
        movie.name,
        'Full Movie',
        1,
        1,
        movie.poster || movie.image || null // Agregar poster
      )
      
      const watchedMovie = {
        id: Date.now(),
        series_id: movie.id,
        episode_id: `movie_${movie.id}`,
        series_name: movie.name,
        episode_name: 'Full Movie',
        season_number: 1,
        episode_number: 1,
        poster_url: movie.poster || movie.image || null, // Agregar poster
        watched_at: new Date().toISOString(),
        is_movie: true
      }
      
      watchedEpisodes.value.push(watchedMovie)
      localStorageService.setItem('watchedEpisodes', watchedEpisodes.value)
      console.log('✅ Movie marked as watched successfully')
    } catch (error) {
      console.error('❌ Error marking movie as watched:', error)
      throw error
    }
  }

  const markAsUnwatched = async (episodeId) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      console.log('🗑️ Marking as unwatched:', episodeId)
      await tursoDb.removeWatchedEpisode(authStore.user.id, episodeId)
      
      // Remover del array local
      watchedEpisodes.value = watchedEpisodes.value.filter(ep => ep.episode_id !== episodeId)
      localStorageService.setItem('watchedEpisodes', watchedEpisodes.value)
      console.log('✅ Marked as unwatched successfully')
    } catch (error) {
      console.error('❌ Error unmarking episode as watched:', error)
      throw error
    }
  }

  const isEpisodeWatched = (episodeId) => {
    return watchedEpisodes.value.some(ep => ep.episode_id == episodeId)
  }

  // Verificar si película está vista
  const isMovieWatched = (movieId) => {
    return watchedEpisodes.value.some(ep => ep.episode_id == `movie_${movieId}`)
  }

  const isSeriesCompletelyWatched = (seriesId, totalEpisodes = null) => {
    const seriesEpisodes = watchedEpisodes.value.filter(ep => ep.series_id == seriesId && !ep.is_movie)
    if (totalEpisodes) {
      return seriesEpisodes.length >= totalEpisodes
    }
    return seriesEpisodes.length > 0
  }

  const getWatchedEpisodesForSeries = (seriesId) => {
    return watchedEpisodes.value.filter(ep => ep.series_id == seriesId && !ep.is_movie)
  }

  const clearWatchedEpisodes = () => {
    watchedEpisodes.value = []
    localStorageService.removeItem('watchedEpisodes')
    console.log('🧹 Watched episodes cleared')
  }

  // Funciones adicionales para mejor organización
  const getWatchedMovies = () => {
    return watchedEpisodes.value.filter(ep => ep.is_movie)
  }

  const getWatchedSeriesEpisodes = () => {
    return watchedEpisodes.value.filter(ep => !ep.is_movie)
  }

  const getStatsData = computed(() => {
    const episodes = watchedEpisodes.value
    const totalEpisodes = episodes.length
    const uniqueSeries = new Set(episodes.map(ep => ep.series_id)).size
    
    // Calcular tiempo total visto (45 min por episodio, 120 min por película)
    const totalMinutes = episodes.reduce((acc, ep) => {
      return acc + (ep.is_movie ? 120 : 45)
    }, 0)
    const hoursWatched = Math.round(totalMinutes / 60)
    
    return {
      totalEpisodes,
      uniqueSeries,
      hoursWatched,
      moviesWatched: episodes.filter(ep => ep.is_movie).length,
      seriesEpisodesWatched: episodes.filter(ep => !ep.is_movie).length
    }
  })

  return {
    watchedEpisodes,
    watchedSeries,
    loading,
    loadWatchedEpisodes,
    markAsWatched,
    markMovieAsWatched,
    markAsUnwatched,
    isEpisodeWatched,
    isMovieWatched,
    isSeriesCompletelyWatched,
    getWatchedEpisodesForSeries,
    clearWatchedEpisodes,
    getWatchedMovies,
    getWatchedSeriesEpisodes,
    getStatsData
  }
})