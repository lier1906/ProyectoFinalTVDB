<template>
  <div class="movie-detail">
    <!-- Header con back button y menú -->
    <div class="detail-header">
      <button @click="goBack" class="back-button">
        <ArrowLeft class="back-icon" />
      </button>
      <div class="header-menu">
        <MoreVertical class="menu-icon" />
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <h2>Error</h2>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="retryLoad">Reintentar</button>
      </div>
    </div>

    <div v-else-if="movie" class="detail-content">
      <!-- Hero Image -->
      <div class="hero-section">
        <div class="hero-image">
          <img
            v-if="movie.fanart || movie.poster"
            :src="movie.fanart || movie.poster"
            :alt="movie.name"
            @error="handleImageError"
          />
          <div v-else class="image-placeholder">
            <Film class="placeholder-icon" />
          </div>
          
          <!-- Gradient overlay -->
          <div class="hero-gradient"></div>
          
          <!-- Movie poster overlay -->
          <div class="movie-poster-overlay">
            <img
              v-if="movie.poster"
              :src="movie.poster"
              :alt="movie.name"
              @error="handleImageError"
            />
            <div v-else class="poster-placeholder">🎬</div>
          </div>
        </div>
      </div>

      <!-- Movie Info -->
      <div class="movie-info">
        <!-- Movie Badge -->
        <div class="media-type-badge">
          <Film class="badge-icon" />
          <span>Movie</span>
        </div>

        <!-- Title -->
        <h1 class="movie-title">{{ movie.name }}</h1>

        <!-- Meta Information -->
        <div class="movie-meta">
          <div class="meta-row">
            <span class="imdb-badge">IMDb</span>
            <span class="rating">{{ movie.rating?.toFixed(1) || 'N/A' }}</span>
            <span class="year">{{ movie.year || new Date(movie.releaseDate).getFullYear() }}</span>
            <span class="duration">{{ movie.runtime ? movie.runtime + 'm' : '120m' }}</span>
            <span class="status" :class="getStatusClass()">{{ movie.status || 'Released' }}</span>
          </div>
        </div>

        <!-- Genres -->
        <div class="genres" v-if="movie.genres && movie.genres.length">
          <span 
            v-for="genre in movie.genres.slice(0, 3)" 
            :key="genre" 
            class="genre-tag"
          >
            {{ genre }}
          </span>
        </div>

        <!-- Synopsis -->
        <p class="movie-overview">{{ movie.overview || 'No description available.' }}</p>

        <!-- Directors/Studios -->
        <div v-if="movie.studios && movie.studios.length" class="creators">
          <span class="creators-label">Studios:</span>
          <span class="creators-names">{{ movie.studios.slice(0, 2).join(', ') }}</span>
        </div>

        <!-- Release Date -->
        <div v-if="movie.releaseDate" class="release-info">
          <span class="release-label">Release Date:</span>
          <span class="release-date">{{ formatDate(movie.releaseDate) }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <!-- Watch Now Button -->
          <button class="watch-now-btn">
            <Play class="btn-icon" />
            Watch Now
          </button>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button 
              class="action-btn"
              :class="{ active: isInWatchlist }"
              @click="toggleWatchlist"
              :title="isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'"
            >
              <Clock class="action-icon" />
            </button>

            <button 
              class="action-btn"
              :class="{ active: isWatched }"
              @click="toggleWatched"
              :title="isWatched ? 'Mark as unwatched' : 'Mark as watched'"
            >
              <Check class="action-icon" />
            </button>

            <button 
              class="action-btn"
              :class="{ active: isFavorite }"
              @click="toggleFavorite"
              :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
            >
              <Star class="action-icon" />
            </button>
          </div>
        </div>

        <!-- Movie Stats -->
        <div class="movie-stats">
          <div class="stat-item">
            <span class="stat-label">Runtime</span>
            <span class="stat-value">{{ movie.runtime || 120 }} min</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Release Year</span>
            <span class="stat-value">{{ movie.year || new Date(movie.releaseDate).getFullYear() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Language</span>
            <span class="stat-value">{{ movie.language || 'English' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Country</span>
            <span class="stat-value">{{ movie.country || 'USA' }}</span>
          </div>
        </div>

        <!-- Similar Movies -->
        <div class="similar-section">
          <h3 class="section-title">You might also like</h3>
          <div class="similar-grid">
            <div 
              v-for="similarMovie in similarMovies" 
              :key="similarMovie.id" 
              class="similar-card"
              @click="goToSimilarMovie(similarMovie.id)"
            >
              <div class="similar-poster">
                <img 
                  v-if="similarMovie.poster"
                  :src="similarMovie.poster"
                  :alt="similarMovie.name"
                  @error="handleImageError"
                />
                <div v-else class="poster-placeholder">
                  <Film class="placeholder-icon" />
                </div>
              </div>
              <p class="similar-title">{{ similarMovie.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, MoreVertical, Film, Play, Clock, Check, Star
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useWatchlistStore } from '@/stores/watchlist'
import { useFavoritesStore } from '@/stores/favorites'
import { useWatchedStore } from '@/stores/watched'
import { useMoviesStore } from '@/stores/movies'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import tvdbApi from '@/services/tvdbApi'

const route = useRoute()
const router = useRouter()
const watchlistStore = useWatchlistStore()
const favoritesStore = useFavoritesStore()
const watchedStore = useWatchedStore()
const moviesStore = useMoviesStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

const movie = ref(null)
const loading = ref(false)
const error = ref(null)
const similarMovies = ref([])

const movieId = computed(() => route.params.id)

// Computed properties
const isInWatchlist = computed(() => {
  return movie.value ? watchlistStore.isInWatchlist(movie.value.id) : false
})

const isFavorite = computed(() => {
  return movie.value ? favoritesStore.isFavorite(movie.value.id) : false
})

const isWatched = computed(() => {
  return movie.value ? watchedStore.isMovieWatched(movie.value.id) : false
})

// Methods
const loadMovieDetails = async () => {
  try {
    loading.value = true
    error.value = null

    const id = movieId.value
    console.log('🎬 Loading movie details for ID:', id)
    
    // Primero intentar obtener de la búsqueda local
    let movieData = moviesStore.getMovieById(id)
    
    if (!movieData) {
      console.log('🔍 Movie not found in store, trying API...')
      
      try {
        // Limpiar el ID para la API
        const cleanId = String(id).replace(/[^\d]/g, '')
        console.log('🧹 Clean ID for API:', cleanId)
        
        movieData = await tvdbApi.getMovieById(cleanId, true)
        console.log('✅ Movie data from API:', movieData)
      } catch (apiError) {
        console.warn('⚠️ API failed, creating fallback data:', apiError.message)
        
        // Si falla la API, crear datos básicos pero funcionales
        movieData = {
          id: id,
          name: 'Movie Title',
          overview: 'Movie description not available.',
          rating: 7.5,
          year: 2023,
          runtime: 120,
          genres: ['Action', 'Adventure'],
          poster: null,
          fanart: null,
          releaseDate: '2023-01-01',
          status: 'Released',
          studios: ['Studio Name'],
          country: 'USA',
          language: 'English'
        }
      }
    }
    
    if (!movieData) {
      throw new Error('No se pudieron cargar los datos de la película')
    }
    
    movie.value = movieData
    console.log('✅ Movie loaded successfully:', movie.value.name)
    
    // Cargar películas similares
    await loadSimilarMovies()
    
  } catch (err) {
    console.error('❌ Error loading movie:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const loadSimilarMovies = async () => {
  try {
    // Obtener algunas películas trending como similares
    if (moviesStore.trendingMovies.length > 0) {
      // Filtrar la película actual y tomar 6 aleatorias
      const otherMovies = moviesStore.trendingMovies.filter(m => m.id !== movie.value.id)
      similarMovies.value = otherMovies.slice(0, 6)
    } else {
      // Si no hay trending movies, crear datos de placeholder
      similarMovies.value = Array.from({ length: 6 }, (_, i) => ({
        id: `similar_${i + 1}`,
        name: `Similar Movie ${i + 1}`,
        poster: null
      }))
    }
  } catch (error) {
    console.error('Error loading similar movies:', error)
    // En caso de error, mostrar placeholders
    similarMovies.value = Array.from({ length: 6 }, (_, i) => ({
      id: `similar_${i + 1}`,
      name: `Similar Movie ${i + 1}`,
      poster: null
    }))
  }
}

const toggleWatchlist = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isInWatchlist.value) {
      await watchlistStore.removeFromWatchlist(movie.value.id)
      uiStore.showToast('Removed from watchlist', 'success')
    } else {
      // Adaptar datos de película para watchlist
      const watchlistItem = {
        ...movie.value,
        type: 'movie' // Marcar como película
      }
      await watchlistStore.addToWatchlist(watchlistItem)
      uiStore.showToast('Added to watchlist', 'success')
    }
  } catch (error) {
    uiStore.showToast('Error updating watchlist', 'error')
  }
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isFavorite.value) {
      await favoritesStore.removeFromFavorites(movie.value.id)
      uiStore.showToast('Removed from favorites', 'success')
    } else {
      // Adaptar datos de película para favoritos
      const favoriteItem = {
        ...movie.value,
        type: 'movie'
      }
      await favoritesStore.addToFavorites(favoriteItem)
      uiStore.showToast('Added to favorites', 'success')
    }
  } catch (error) {
    uiStore.showToast('Error updating favorites', 'error')
  }
}

const toggleWatched = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isWatched.value) {
      await watchedStore.markAsUnwatched(`movie_${movie.value.id}`)
      uiStore.showToast('Movie marked as unwatched', 'success')
    } else {
      await watchedStore.markMovieAsWatched(movie.value)
      uiStore.showToast('Movie marked as watched', 'success')
    }
  } catch (error) {
    console.error('Error toggling watched status:', error)
    uiStore.showToast('Error updating watch status', 'error')
  }
}

const goToSimilarMovie = (movieId) => {
  router.push({ name: 'movie-detail', params: { id: movieId } })
}

const getStatusClass = () => {
  if (!movie.value?.status) return ''
  const status = movie.value.status.toLowerCase()
  if (status.includes('released')) return 'status-released'
  if (status.includes('production')) return 'status-production'
  return 'status-unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const retryLoad = () => {
  loadMovieDetails()
}

const goBack = () => {
  router.go(-1)
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// Lifecycle
watch(() => route.params.id, () => {
  if (route.params.id) {
    loadMovieDetails()
  }
})

onMounted(() => {
  if (movieId.value) {
    loadMovieDetails()
  } else {
    error.value = 'No se proporcionó un ID de película válido'
  }
})
</script>

<style scoped>
.movie-detail {
  min-height: 100vh;
  background: #0F0F23;
  color: white;
  position: relative;
}

.detail-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  z-index: 10;
  background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.back-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.header-menu {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.menu-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.error-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.error-message {
  color: #ff6b6b;
  margin: 15px 0;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 15px;
}

.hero-section {
  position: relative;
  height: 50vh;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  position: relative;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 60px;
  height: 60px;
  color: white;
  opacity: 0.5;
}

.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, #0F0F23 0%, transparent 100%);
}

.movie-poster-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 100px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.movie-poster-overlay img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #666;
}

.movie-info {
  padding: 20px;
  margin-top: -100px;
  position: relative;
  z-index: 5;
}

.media-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 15px;
  backdrop-filter: blur(10px);
}

.badge-icon {
  width: 14px;
  height: 14px;
}

.movie-title {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 15px;
  line-height: 1.2;
}

.movie-meta {
  margin-bottom: 15px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.imdb-badge {
  background: #F5C518;
  color: #000;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.rating {
  font-weight: bold;
  color: #F5C518;
}

.year, .duration {
  color: #999;
  font-size: 14px;
}

.status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-released {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-production {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.status-unknown {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.genres {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.genre-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  color: white;
}

.movie-overview {
  font-size: 16px;
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 15px;
}

.creators, .release-info {
  margin-bottom: 15px;
  font-size: 14px;
}

.creators-label, .release-label {
  color: #999;
}

.creators-names, .release-date {
  color: white;
  font-weight: 500;
}

.action-buttons {
  margin-bottom: 40px;
}

.watch-now-btn {
  width: 100%;
  background: #667eea;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.watch-now-btn:hover {
  background: #5a67d8;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.action-btn {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.action-btn.active {
  background: #667eea;
  color: white;
}

.action-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.movie-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 40px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.similar-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: white;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.similar-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.similar-card:hover {
  transform: scale(1.05);
}

.similar-poster {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #333;
}

.similar-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.similar-poster .poster-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.similar-poster .placeholder-icon {
  width: 30px;
  height: 30px;
  color: white;
  opacity: 0.7;
}

.similar-title {
  font-size: 12px;
  color: #ccc;
  text-align: center;
  margin: 0;
  line-height: 1.3;
}

/* Responsive */
@media (max-width: 768px) {
  .movie-info {
    padding: 15px;
  }
  
  .movie-title {
    font-size: 28px;
  }
  
  .meta-row {
    gap: 8px;
  }
  
  .quick-actions {
    gap: 15px;
  }
  
  .action-btn {
    width: 45px;
    height: 45px;
  }

  .movie-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .detail-header {
    padding: 15px;
  }
  
  .movie-info {
    padding: 15px;
    margin-top: -80px;
  }
  
  .movie-title {
    font-size: 24px;
  }
  
  .movie-poster-overlay {
    width: 80px;
    height: 120px;
    bottom: 15px;
    left: 15px;
  }

  .similar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>