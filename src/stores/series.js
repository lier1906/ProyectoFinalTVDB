// stores/series.js
import { defineStore } from 'pinia'
import tvdbApi from '@/services/tvdbApi'

export const useSeriesStore = defineStore('series', {
  state: () => ({
    trendingSeries: [],
    searchResults: [],
    selectedSeries: null,
    loading: false,
    searchLoading: false,
    error: null
  }),

  getters: {
    getSeriesById: (state) => (id) => {
      return state.trendingSeries.find(series => series.id === id) ||
             state.searchResults.find(series => series.id === id)
    },

    hasSearchResults: (state) => state.searchResults.length > 0
  },

  actions: {
    async fetchTrendingSeries() {
      try {
        this.loading = true
        this.error = null
        
        console.log('🔄 Fetching trending series...')
        
        // Intentar obtener series trending
        let series = []
        try {
          series = await tvdbApi.getTrendingSeries()
          console.log('✅ API returned:', series.length, 'series')
        } catch (apiError) {
          console.warn('⚠️ API error, using fallback data:', apiError.message)
          series = this.getFallbackSeries()
        }

        // Validar y procesar datos
        const validSeries = series
          .filter(s => s && s.id && s.name)
          .map(s => ({
            ...s,
            imageLoaded: false,
            poster: s.poster || null,
            rating: s.rating || Math.random() * 2 + 7, // Rating aleatorio entre 7-9
            year: s.year || this.extractYearFromDate(s.firstAired)
          }))
          .slice(0, 20) // Limitar a 20 series

        this.trendingSeries = validSeries
        console.log('✅ Stored', validSeries.length, 'trending series')
        
      } catch (error) {
        console.error('❌ Error fetching trending series:', error)
        this.error = error.message
        // Usar datos de fallback en caso de error completo
        this.trendingSeries = this.getFallbackSeries()
      } finally {
        this.loading = false
      }
    },

    async searchSeries(query) {
      if (!query?.trim()) {
        this.clearSearch()
        return
      }

      try {
        this.searchLoading = true
        this.error = null
        
        console.log('🔍 Searching for:', query)
        
        const results = await tvdbApi.searchSeries(query)
        
        // Procesar resultados de búsqueda
        const processedResults = results
          .filter(s => s && s.id && s.name)
          .map(s => ({
            ...s,
            imageLoaded: false,
            poster: s.poster || null,
            rating: s.rating || Math.random() * 2 + 7,
            year: s.year || this.extractYearFromDate(s.firstAired)
          }))
          .slice(0, 50) // Limitar resultados

        this.searchResults = processedResults
        console.log('✅ Found', processedResults.length, 'results')
        
      } catch (error) {
        console.error('❌ Error searching series:', error)
        this.error = error.message
        this.searchResults = []
      } finally {
        this.searchLoading = false
      }
    },

    async getSeriesDetails(id) {
      try {
        this.loading = true
        this.error = null
        
        console.log('📺 Fetching details for series:', id)
        
        const series = await tvdbApi.getSeriesById(id, true)
        
        const processedSeries = {
          ...series,
          imageLoaded: false,
          year: series.year || this.extractYearFromDate(series.firstAired)
        }
        
        this.selectedSeries = processedSeries
        console.log('✅ Series details loaded')
        
        return processedSeries
        
      } catch (error) {
        console.error('❌ Error fetching series details:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    clearSearch() {
      this.searchResults = []
      this.searchLoading = false
      this.error = null
    },

    clearSelectedSeries() {
      this.selectedSeries = null
    },

    // Utility methods
    extractYearFromDate(dateString) {
      if (!dateString) return null
      try {
        return new Date(dateString).getFullYear()
      } catch {
        return null
      }
    },

    getFallbackSeries() {
      return [
        {
          id: 1,
          name: 'The Last of Us',
          overview: 'A post-apocalyptic drama series based on the video game.',
          poster: null,
          rating: 8.7,
          year: 2023,
          firstAired: '2023-01-15',
          status: 'Continuing',
          genres: ['Drama', 'Horror', 'Sci-Fi'],
          imageLoaded: false
        },
        {
          id: 2,
          name: 'House of the Dragon',
          overview: 'A prequel to Game of Thrones set 200 years before the events of the original series.',
          poster: null,
          rating: 8.4,
          year: 2022,
          firstAired: '2022-08-21',
          status: 'Continuing',
          genres: ['Drama', 'Fantasy', 'Action'],
          imageLoaded: false
        },
        {
          id: 3,
          name: 'Stranger Things',
          overview: 'A group of kids uncover supernatural mysteries in their small town.',
          poster: null,
          rating: 8.7,
          year: 2016,
          firstAired: '2016-07-15',
          status: 'Ended',
          genres: ['Drama', 'Horror', 'Sci-Fi'],
          imageLoaded: false
        },
        {
          id: 4,
          name: 'The Mandalorian',
          overview: 'A lone bounty hunter in the outer reaches of the galaxy.',
          poster: null,
          rating: 8.6,
          year: 2019,
          firstAired: '2019-11-12',
          status: 'Continuing',
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          imageLoaded: false
        },
        {
          id: 5,
          name: 'The Witcher',
          overview: 'A monster hunter navigates a world where people often prove more wicked than beasts.',
          poster: null,
          rating: 8.2,
          year: 2019,
          firstAired: '2019-12-20',
          status: 'Continuing',
          genres: ['Action', 'Adventure', 'Fantasy'],
          imageLoaded: false
        },
        {
          id: 6,
          name: 'Wednesday',
          overview: 'Wednesday Addams investigates supernatural mysteries at her new school.',
          poster: null,
          rating: 8.1,
          year: 2022,
          firstAired: '2022-11-23',
          status: 'Continuing',
          genres: ['Comedy', 'Horror', 'Mystery'],
          imageLoaded: false
        }
      ]
    }
  }
})