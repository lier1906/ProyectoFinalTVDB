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
        item.series_id == id || item.movie_id == id
      )
    },

    // Obtener items por tipo
    seriesInWatchlist: (state) => {
      return state.watchlist.filter(item => item.type === 'series' || !item.type)
    },

    moviesInWatchlist: (state) => {
      return state.watchlist.filter(item => item.type === 'movie')
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
        // Detectar si es película o serie
        const isMovie = item.type === 'movie' || 
                       item.releaseDate || 
                       item.runtime

        console.log('📝 Adding to watchlist:', item.name, 'Type:', isMovie ? 'movie' : 'series')

        if (isMovie) {
          // Para películas
          await tursoDb.addMovieToWatchlist(
            authStore.user.id,
            item.id,
            item.name,
            item.poster
          )
          
          // Agregar al estado local
          this.watchlist.push({
            movie_id: item.id,
            movie_name: item.name,
            movie_poster: item.poster,
            type: 'movie',
            added_at: new Date().toISOString()
          })
        } else {
          // Para series (comportamiento original)
          await tursoDb.addToWatchlist(
            authStore.user.id,
            item.id,
            item.name,
            item.poster
          )
          
          // Agregar al estado local
          this.watchlist.push({
            series_id: item.id,
            series_name: item.name,
            series_poster: item.poster,
            type: 'series',
            added_at: new Date().toISOString()
          })
        }

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
        // Encontrar el item para saber su tipo
        const item = this.watchlist.find(item => 
          item.series_id == id || item.movie_id == id
        )

        if (!item) {
          throw new Error('Item not found in watchlist')
        }

        const isMovie = item.type === 'movie' || item.movie_id

        if (isMovie) {
          await tursoDb.removeMovieFromWatchlist(authStore.user.id, id)
        } else {
          await tursoDb.removeFromWatchlist(authStore.user.id, id)
        }

        // Remover del estado local
        this.watchlist = this.watchlist.filter(item => 
          item.series_id != id && item.movie_id != id
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