// stores/watchlist.js
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import tursoDb from '@/services/tursoDb'

export const useWatchlistStore = defineStore('watchlist', {
  state: () => ({
    watchlist: [],
    loading: false,
    error: null
  }),

  getters: {
    // Verificar si un item está en watchlist (funciona para series y películas)
    isInWatchlist: (state) => (id) => {
      return state.watchlist.some(item => 
        item.series_id == id
      )
    },

    // Obtener items por tipo
    seriesInWatchlist: (state) => {
      return state.watchlist.filter(item => item.item_type === 'series' || !item.item_type)
    },

    moviesInWatchlist: (state) => {
      return state.watchlist.filter(item => item.item_type === 'movie')
    }
  },

  actions: {
    async loadWatchlist() {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      try {
        this.loading = true
        this.error = null
        
        const watchlistData = await tursoDb.getWatchlist(authStore.user.id)
        this.watchlist = watchlistData
        
        console.log('✅ Watchlist loaded:', watchlistData.length, 'items')
      } catch (error) {
        console.error('❌ Error loading watchlist:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async addToWatchlist(item) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        throw new Error('User not authenticated')
      }

      try {
        console.log('🔥 Adding to watchlist:', item)
        
        // Detectar si es película o serie
        const isMovie = item.type === 'movie' || 
                       item.releaseDate || 
                       item.runtime

        const itemType = isMovie ? 'movie' : 'series'
        console.log('🎯 Detected type:', itemType)

        await tursoDb.addToWatchlist(
          authStore.user.id,
          item.id,
          item.name,
          item.poster,
          itemType
        )
        
        // Agregar al estado local
        this.watchlist.push({
          series_id: item.id,
          series_name: item.name,
          series_poster: item.poster,
          item_type: itemType,
          added_at: new Date().toISOString()
        })

        console.log('✅ Added to watchlist successfully')
      } catch (error) {
        console.error('❌ Error adding to watchlist:', error)
        throw error
      }
    },

    async removeFromWatchlist(id) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        throw new Error('User not authenticated')
      }

      try {
        await tursoDb.removeFromWatchlist(authStore.user.id, id)

        // Remover del estado local
        this.watchlist = this.watchlist.filter(item => 
          item.series_id != id
        )

        console.log('✅ Removed from watchlist successfully')
      } catch (error) {
        console.error('❌ Error removing from watchlist:', error)
        throw error
      }
    },

    clearWatchlist() {
      this.watchlist = []
      this.loading = false
      this.error = null
    }
  }
})