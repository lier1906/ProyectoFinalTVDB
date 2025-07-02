import { defineStore } from 'pinia'
import { ref } from 'vue'
import tursoDb from '@/services/tursoDb'
import localStorageService from '@/services/localStorage'
import { useAuthStore } from './auth'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref([])
  const loading = ref(false)

  const loadFavorites = async () => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      favorites.value = []
      return
    }

    loading.value = true
    try {
      const userFavorites = await tursoDb.getFavorites(authStore.user.id)
      favorites.value = userFavorites.map(fav => ({
        series_id: fav.series_id,
        series_name: fav.series_name,
        series_poster: fav.series_poster,
        added_at: fav.added_at
      }))
      
      // Guardar en localStorage como backup
      localStorageService.setItem('favorites', favorites.value)
    } catch (error) {
      console.error('Error loading favorites from DB:', error)
      
      // Fallback to localStorage
      const savedFavorites = localStorageService.getItem('favorites')
      if (savedFavorites) {
        favorites.value = savedFavorites
      }
    } finally {
      loading.value = false
    }
  }

  const addToFavorites = async (series) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    // Verificar si ya existe
    if (isFavorite(series.id)) {
      return
    }

    try {
      await tursoDb.addToFavorites(
        authStore.user.id,
        series.id,
        series.name,
        series.poster || series.image
      )
      
      // Agregar al array local
      const newFavorite = {
        series_id: series.id,
        series_name: series.name,
        series_poster: series.poster || series.image,
        added_at: new Date().toISOString()
      }
      
      favorites.value.push(newFavorite)
      localStorageService.setItem('favorites', favorites.value)
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  const removeFromFavorites = async (seriesId) => {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) return

    try {
      await tursoDb.removeFromFavorites(authStore.user.id, seriesId)
      
      // Remover del array local
      favorites.value = favorites.value.filter(fav => fav.series_id !== seriesId)
      localStorageService.setItem('favorites', favorites.value)
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  const isFavorite = (seriesId) => {
    return favorites.value.some(fav => fav.series_id == seriesId)
  }

  const clearFavorites = () => {
    favorites.value = []
    localStorageService.removeItem('favorites')
  }

  return {
    favorites,
    loading,
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites
  }
})