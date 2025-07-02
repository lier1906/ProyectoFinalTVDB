import { defineStore } from 'pinia'
import { ref } from 'vue'
import tursoDb from '@/services/tursoDb'
import localStorageService from '@/services/localStorage'
import { useAuthStore } from './auth'

export const useWatchlistStore = defineStore('watchlist', () => {
  const watchlist = ref([])
  const loading = ref(false)

  const loadWatchlist = async () => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      watchlist.value = []
      return
    }

    loading.value = true
    try {
      const userWatchlist = await tursoDb.getWatchlist(authStore.user.id)
      watchlist.value = userWatchlist.map(item => ({
        series_id: item.series_id,
        series_name: item.series_name,
        series_poster: item.series_poster,
        added_at: item.added_at
      }))
      
      // Guardar en localStorage como backup
      localStorageService.setItem('watchlist', watchlist.value)
    } catch (error) {
      console.error('Error loading watchlist from DB:', error)
      
      // Fallback to localStorage
      const savedWatchlist = localStorageService.getItem('watchlist')
      if (savedWatchlist) {
        watchlist.value = savedWatchlist
      }
    } finally {
      loading.value = false
    }
  }

  const addToWatchlist = async (series) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    // Verificar si ya existe
    if (isInWatchlist(series.id)) {
      return
    }

    try {
      await tursoDb.addToWatchlist(
        authStore.user.id,
        series.id,
        series.name,
        series.poster || series.image
      )
      
      // Agregar al array local
      const newWatchlistItem = {
        series_id: series.id,
        series_name: series.name,
        series_poster: series.poster || series.image,
        added_at: new Date().toISOString()
      }
      
      watchlist.value.push(newWatchlistItem)
      localStorageService.setItem('watchlist', watchlist.value)
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      throw error
    }
  }

  const removeFromWatchlist = async (seriesId) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      await tursoDb.removeFromWatchlist(authStore.user.id, seriesId)
      
      // Remover del array local
      watchlist.value = watchlist.value.filter(item => item.series_id !== seriesId)
      localStorageService.setItem('watchlist', watchlist.value)
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      throw error
    }
  }

  const isInWatchlist = (seriesId) => {
    return watchlist.value.some(item => item.series_id == seriesId)
  }

  const clearWatchlist = () => {
    watchlist.value = []
    localStorageService.removeItem('watchlist')
  }

  return {
    watchlist,
    loading,
    loadWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist
  }
})