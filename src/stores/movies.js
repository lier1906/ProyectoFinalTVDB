// stores/movies.js
import { defineStore } from 'pinia'
import tvdbApi from '@/services/tvdbApi'

export const useMoviesStore = defineStore('movies', {
  state: () => ({
    trendingMovies: [],
    searchResults: [],
    selectedMovie: null,
    loading: false,
    searchLoading: false,
    error: null
  }),

  getters: {
    getMovieById: (state) => (id) => {
      return state.trendingMovies.find(movie => movie.id === id) ||
             state.searchResults.find(movie => movie.id === id)
    },

    hasSearchResults: (state) => state.searchResults.length > 0
  },

  actions: {
    async fetchTrendingMovies() {
      try {
        this.loading = true
        this.error = null
        
        console.log('🎬 Fetching trending movies...')
        
        // Buscar películas populares usando términos específicos
        const movieQueries = [
          'Avatar',
          'Top Gun',
          'Black Panther', 
          'Batman',
          'Spider-Man',
          'Avengers',
          'Star Wars',
          'Jurassic',
          'Fast and Furious',
          'Mission Impossible'
        ]

        let movies = []
        
        try {
          // Buscar múltiples películas en paralelo
          const searchPromises = movieQueries.map(async (query) => {
            try {
              const results = await tvdbApi.searchMovies(query)
              return results.length > 0 ? results[0] : null
            } catch (error) {
              console.warn(`Error searching for ${query}:`, error.message)
              return null
            }
          })

          const searchResults = await Promise.all(searchPromises)
          movies = searchResults.filter(movie => movie !== null)
          
          console.log('✅ API returned:', movies.length, 'movies')
          
        } catch (apiError) {
          console.warn('⚠️ API error, using fallback data:', apiError.message)
          movies = this.getFallbackMovies()
        }

        // Si no obtuvimos suficientes películas del API, usar fallback
        if (movies.length < 6) {
          console.log('ℹ️ Using fallback movies due to insufficient API results')
          movies = this.getFallbackMovies()
        }

        // Validar y procesar datos
        const validMovies = movies
          .filter(m => m && m.id && m.name)
          .map(m => ({
            ...m,
            imageLoaded: undefined, // Será true/false después de cargar
            poster: m.poster || null,
            rating: m.rating || this.generateRandomRating(),
            year: m.year || this.extractYearFromDate(m.releaseDate),
            overview: m.overview || 'No description available.'
          }))
          .slice(0, 10) // Limitar a 10 películas

        this.trendingMovies = validMovies
        console.log('✅ Stored', validMovies.length, 'trending movies')
        
      } catch (error) {
        console.error('❌ Error fetching trending movies:', error)
        this.error = error.message
        // Usar datos de fallback en caso de error completo
        this.trendingMovies = this.getFallbackMovies()
      } finally {
        this.loading = false
      }
    },

    async searchMovies(query) {
      if (!query?.trim()) {
        this.clearSearch()
        return
      }

      try {
        this.searchLoading = true
        this.error = null
        
        console.log('🔍 Searching movies for:', query)
        
        const results = await tvdbApi.searchMovies(query)
        
        // Procesar resultados de búsqueda
        const processedResults = results
          .filter(m => m && m.id && m.name)
          .map(m => ({
            ...m,
            imageLoaded: undefined,
            poster: m.poster || null,
            rating: m.rating || this.generateRandomRating(),
            year: m.year || this.extractYearFromDate(m.releaseDate),
            overview: m.overview || 'No description available.'
          }))
          .slice(0, 50) // Limitar resultados

        this.searchResults = processedResults
        console.log('✅ Found', processedResults.length, 'movie results')
        
      } catch (error) {
        console.error('❌ Error searching movies:', error)
        this.error = error.message
        this.searchResults = []
      } finally {
        this.searchLoading = false
      }
    },

    async getMovieDetails(id) {
      try {
        this.loading = true
        this.error = null
        
        console.log('🎬 Fetching details for movie:', id)
        
        const movie = await tvdbApi.getMovieById(id, true)
        
        const processedMovie = {
          ...movie,
          imageLoaded: undefined,
          year: movie.year || this.extractYearFromDate(movie.releaseDate)
        }
        
        this.selectedMovie = processedMovie
        console.log('✅ Movie details loaded')
        
        return processedMovie
        
      } catch (error) {
        console.error('❌ Error fetching movie details:', error)
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

    clearSelectedMovie() {
      this.selectedMovie = null
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

    generateRandomRating() {
      // Generar rating realista entre 6.0 y 9.0
      return Math.random() * 3 + 6
    },

    getFallbackMovies() {
      return [
        {
          id: `movie_1`,
          name: 'Avatar: The Way of Water',
          overview: 'Jake Sully lives with his newfound family formed on the planet of Pandora.',
          poster: null,
          rating: 7.6,
          year: 2022,
          releaseDate: '2022-12-16',
          runtime: 192,
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          imageLoaded: undefined
        },
        {
          id: `movie_2`,
          name: 'Top Gun: Maverick',
          overview: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator.',
          poster: null,
          rating: 8.3,
          year: 2022,
          releaseDate: '2022-05-27',
          runtime: 130,
          genres: ['Action', 'Drama'],
          imageLoaded: undefined
        },
        {
          id: `movie_3`,
          name: 'Black Panther: Wakanda Forever',
          overview: 'The people of Wakanda fight to protect their home from intervening world powers.',
          poster: null,
          rating: 6.7,
          year: 2022,
          releaseDate: '2022-11-11',
          runtime: 161,
          genres: ['Action', 'Adventure', 'Drama'],
          imageLoaded: undefined
        },
        {
          id: `movie_4`,
          name: 'The Batman',
          overview: 'When a sadistic serial killer begins murdering key political figures in Gotham.',
          poster: null,
          rating: 7.8,
          year: 2022,
          releaseDate: '2022-03-04',
          runtime: 176,
          genres: ['Action', 'Crime', 'Drama'],
          imageLoaded: undefined
        },
        {
          id: `movie_5`,
          name: 'Spider-Man: No Way Home',
          overview: 'Spider-Man seeks to uncover the mystery of his identity leak.',
          poster: null,
          rating: 8.2,
          year: 2021,
          releaseDate: '2021-12-17',
          runtime: 148,
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          imageLoaded: undefined
        },
        {
          id: `movie_6`,
          name: 'Jurassic World Dominion',
          overview: 'Four years after the destruction of Isla Nublar, dinosaurs now live alongside humans.',
          poster: null,
          rating: 5.6,
          year: 2022,
          releaseDate: '2022-06-10',
          runtime: 147,
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          imageLoaded: undefined
        }
      ]
    }
  }
})