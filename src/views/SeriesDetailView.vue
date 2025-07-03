<template>
  <div class="series-detail">
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

    <div v-else-if="series" class="detail-content">
      <!-- Hero Image -->
      <div class="hero-section">
        <div class="hero-image">
          <img
            v-if="series.fanart || series.poster"
            :src="series.fanart || series.poster"
            :alt="series.name"
            @error="handleImageError"
          />
          <div v-else class="image-placeholder">
            <Tv class="placeholder-icon" />
          </div>
          
          <!-- Gradient overlay -->
          <div class="hero-gradient"></div>
          
          <!-- Series poster overlay -->
          <div class="series-poster-overlay">
            <img
              v-if="series.poster"
              :src="series.poster"
              :alt="series.name"
              @error="handleImageError"
            />
            <div v-else class="poster-placeholder">🎬</div>
          </div>
        </div>
      </div>

      <!-- Series Info -->
      <div class="series-info">
        <!-- TV Series Badge -->
        <div class="media-type-badge">
          <Tv class="badge-icon" />
          <span>TV series</span>
        </div>

        <!-- Title -->
        <h1 class="series-title">{{ series.name }}</h1>

        <!-- Meta Information -->
        <div class="series-meta">
          <div class="meta-row">
            <span class="imdb-badge">IMDb</span>
            <span class="rating">{{ series.rating?.toFixed(1) || 'N/A' }}</span>
            <span class="year">{{ series.year || new Date(series.firstAired).getFullYear() }}</span>
            <span class="seasons">{{ seasons.length || 1 }} season{{ seasons.length !== 1 ? 's' : '' }}</span>
            <span class="status" :class="getStatusClass()">{{ series.status || 'Ongoing' }}</span>
            <span class="duration">45m</span>
          </div>
        </div>

        <!-- Genres -->
        <div class="genres" v-if="series.genres && series.genres.length">
          <span 
            v-for="genre in series.genres.slice(0, 3)" 
            :key="genre" 
            class="genre-tag"
          >
            {{ genre }}
          </span>
        </div>

        <!-- Synopsis -->
        <p class="series-overview">{{ series.overview || 'No description available.' }}</p>

        <!-- Creators -->
        <div v-if="series.companies && series.companies.length" class="creators">
          <span class="creators-label">Creators:</span>
          <span class="creators-names">{{ series.companies.slice(0, 2).join(', ') }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <!-- Start Watching Button -->
          <button class="start-watching-btn">
            <Play class="btn-icon" />
            Start watching
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
              :class="{ active: hasWatchedEpisodes }"
              @click="markAsWatched"
              title="Mark as watched"
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

        <!-- Seasons & Episodes -->
        <div v-if="seasons.length" class="seasons-section">
          <h3 class="section-title">Seasons</h3>
          <div class="seasons-list">
            <div
              v-for="season in seasons"
              :key="season.id"
              class="season-item"
              @click="selectSeason(season)"
            >
              <div class="season-poster">
                <img v-if="season.image" :src="season.image" :alt="season.name" />
                <div v-else class="season-placeholder">S{{ season.number }}</div>
              </div>
              <div class="season-info">
                <h4 class="season-name">{{ season.name || `Season ${season.number}` }}</h4>
                <p class="season-episodes">{{ season.episodes?.length || 0 }} episodes</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Episodes (if season selected) -->
        <div v-if="selectedSeason && displayedEpisodes.length" class="episodes-section">
          <h3 class="section-title">Episodes</h3>
          <div class="episodes-list">
            <div
              v-for="episode in displayedEpisodes"
              :key="episode.id"
              class="episode-item"
              @click="playEpisode(episode)"
            >
              <div class="episode-number">{{ episode.number }}</div>
              <div class="episode-info">
                <h4 class="episode-title">{{ episode.name }}</h4>
                <p class="episode-overview">{{ episode.overview || 'No description available.' }}</p>
                <div class="episode-meta">
                  <span v-if="episode.firstAired">{{ formatDate(episode.firstAired) }}</span>
                  <span v-if="episode.runtime">{{ episode.runtime }}m</span>
                </div>
              </div>
              <button 
                class="episode-watched-btn"
                :class="{ watched: isEpisodeWatched(episode.id) }"
                @click.stop="toggleEpisodeWatched(episode)"
              >
                <Check class="check-icon" />
              </button>
            </div>
          </div>
        </div>

        <!-- Episodes sin temporada seleccionada -->
        <div v-else-if="episodes.length && !selectedSeason" class="episodes-section">
          <h3 class="section-title">Episodes</h3>
          <div class="episodes-list">
            <div
              v-for="episode in episodes.slice(0, 10)"
              :key="episode.id"
              class="episode-item"
              @click="playEpisode(episode)"
            >
              <div class="episode-number">{{ episode.number }}</div>
              <div class="episode-info">
                <h4 class="episode-title">{{ episode.name }}</h4>
                <p class="episode-overview">{{ episode.overview || 'No description available.' }}</p>
                <div class="episode-meta">
                  <span v-if="episode.firstAired">{{ formatDate(episode.firstAired) }}</span>
                  <span v-if="episode.runtime">{{ episode.runtime }}m</span>
                </div>
              </div>
              <button 
                class="episode-watched-btn"
                :class="{ watched: isEpisodeWatched(episode.id) }"
                @click.stop="toggleEpisodeWatched(episode)"
              >
                <Check class="check-icon" />
              </button>
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
  ArrowLeft, MoreVertical, Tv, Play, Clock, Check, Star, 
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useWatchlistStore } from '@/stores/watchlist'
import { useFavoritesStore } from '@/stores/favorites'
import { useWatchedStore } from '@/stores/watched'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import tvdbApi from '@/services/tvdbApi'

const route = useRoute()
const router = useRouter()
const watchlistStore = useWatchlistStore()
const favoritesStore = useFavoritesStore()
const watchedStore = useWatchedStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

const series = ref(null)
const seasons = ref([])
const episodes = ref([])
const selectedSeason = ref(null)
const loading = ref(false)
const loadingEpisodes = ref(false)
const error = ref(null)
const currentEpisodePage = ref(0)
const hasMoreEpisodes = ref(false)

const seriesId = computed(() => route.params.id)

// Computed properties
const isInWatchlist = computed(() => {
  return series.value ? watchlistStore.isInWatchlist(series.value.id) : false
})

const isFavorite = computed(() => {
  return series.value ? favoritesStore.isFavorite(series.value.id) : false
})

const hasWatchedEpisodes = computed(() => {
  return series.value ? watchedStore.getWatchedEpisodesForSeries(series.value.id).length > 0 : false
})

const displayedEpisodes = computed(() => {
  if (selectedSeason.value) {
    return selectedSeason.value.episodes || []
  }
  return episodes.value
})

const isEpisodeWatched = (episodeId) => {
  return watchedStore.isEpisodeWatched(episodeId)
}

// Watcher para refrescar cuando cambien los episodios vistos
watch(() => watchedStore.watchedEpisodes, () => {
  // Forzar re-render cuando cambien los episodios vistos
}, { deep: true })

// Methods
const validateSeriesId = () => {
  const id = seriesId.value
  if (!id) {
    throw new Error('ID de serie no proporcionado en la URL')
  }
  const numericMatch = String(id).match(/(\d+)$/)
  if (!numericMatch) {
    throw new Error(`ID de serie inválido: "${id}". No contiene un número válido.`)
  }
  return numericMatch[1]
}

const loadSeriesDetails = async () => {
  try {
    loading.value = true
    error.value = null

    const validId = validateSeriesId()
    const seriesData = await tvdbApi.getSeriesById(validId, true)
    series.value = seriesData

    if (seriesData.seasons?.length) {
      seasons.value = seriesData.seasons
    } else {
      try {
        const seasonsData = await tvdbApi.getSeriesSeasons(validId)
        seasons.value = seasonsData
      } catch (seasonError) {
        console.warn('No se pudieron cargar las temporadas:', seasonError.message)
      }
    }

    await loadEpisodes(validId, 0)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const loadEpisodes = async (id, page = 0) => {
  try {
    loadingEpisodes.value = true
    const episodesData = await tvdbApi.getSeriesEpisodes(id, page)

    if (page === 0) {
      episodes.value = episodesData.episodes
    } else {
      episodes.value.push(...episodesData.episodes)
    }

    hasMoreEpisodes.value = episodesData.links?.next ? true : false
    currentEpisodePage.value = page
  } catch (err) {
    console.error('Error cargando episodios:', err)
  } finally {
    loadingEpisodes.value = false
  }
}

const selectSeason = (season) => {
  selectedSeason.value = season
}

const toggleWatchlist = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isInWatchlist.value) {
      await watchlistStore.removeFromWatchlist(series.value.id)
      uiStore.showToast('Removido de watchlist', 'success')
    } else {
      await watchlistStore.addToWatchlist(series.value)
      uiStore.showToast('Agregado a watchlist', 'success')
    }
  } catch (error) {
    uiStore.showToast('Error al actualizar watchlist', 'error')
  }
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (isFavorite.value) {
      await favoritesStore.removeFromFavorites(series.value.id)
      uiStore.showToast('Removido de favoritos', 'success')
    } else {
      await favoritesStore.addToFavorites(series.value)
      uiStore.showToast('Agregado a favoritos', 'success')
    }
  } catch (error) {
    uiStore.showToast('Error al actualizar favoritos', 'error')
  }
}

const markAsWatched = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    // Si hay episodios cargados, marcar algunos como ejemplo
    if (displayedEpisodes.value.length > 0) {
      const firstEpisode = displayedEpisodes.value[0]
      const episodeData = {
        id: firstEpisode.id,
        name: firstEpisode.name,
        seasonNumber: firstEpisode.seasonNumber || firstEpisode.season || 1,
        number: firstEpisode.number || firstEpisode.episodeNumber || 1
      }
      
      const seriesData = {
        id: series.value.id,
        name: series.value.name,
        poster: series.value.poster
      }
      
      await watchedStore.markAsWatched(episodeData, seriesData)
      uiStore.showToast('Episode marked as watched', 'success')
      
      // Refrescar datos
      setTimeout(() => {
        watchedStore.loadWatchedEpisodes()
      }, 300)
    } else {
      uiStore.showToast('No episodes available to mark as watched', 'info')
    }
  } catch (error) {
    console.error('❌ Error marking series as watched:', error)
    uiStore.showToast('Error marking series as watched', 'error')
  }
}

const toggleEpisodeWatched = async (episode) => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    console.log('🔄 Toggling episode watched status:', episode)
    
    if (isEpisodeWatched(episode.id)) {
      await watchedStore.markAsUnwatched(episode.id)
      uiStore.showToast('Episode marked as unwatched', 'success')
    } else {
      // Asegurar que el episodio tenga la estructura correcta
      const episodeData = {
        id: episode.id,
        name: episode.name,
        seasonNumber: episode.seasonNumber || episode.season || 1,
        number: episode.number || episode.episodeNumber || 1
      }
      
      // Asegurar que la serie tenga la estructura correcta  
      const seriesData = {
        id: series.value.id,
        name: series.value.name,
        poster: series.value.poster
      }
      
      console.log('📺 Episode data:', episodeData)
      console.log('📺 Series data:', seriesData)
      
      await watchedStore.markAsWatched(episodeData, seriesData)
      uiStore.showToast('Episode marked as watched', 'success')
    }
    
    // Forzar actualización de los datos
    setTimeout(() => {
      watchedStore.loadWatchedEpisodes()
    }, 300)
    
  } catch (error) {
    console.error('❌ Error toggling episode watched status:', error)
    uiStore.showToast('Error updating episode status', 'error')
  }
}

const playEpisode = (episode) => {
  // Aquí podrías integrar con un reproductor de video
  uiStore.showToast(`Reproducir: ${episode.name}`, 'info')
}

const getStatusClass = () => {
  if (!series.value?.status) return ''
  const status = series.value.status.toLowerCase()
  if (status.includes('continuing') || status.includes('ongoing')) return 'status-ongoing'
  if (status.includes('ended') || status.includes('completed')) return 'status-ended'
  return 'status-unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const retryLoad = () => {
  loadSeriesDetails()
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
    loadSeriesDetails()
  }
})

onMounted(() => {
  if (seriesId.value) {
    loadSeriesDetails()
  } else {
    error.value = 'No se proporcionó un ID de serie válido'
  }
})
</script>

<style scoped>
.series-detail {
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

.series-poster-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 100px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.series-poster-overlay img {
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

.series-info {
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

.series-title {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 15px;
  line-height: 1.2;
}

.series-meta {
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

.year, .seasons, .duration {
  color: #999;
  font-size: 14px;
}

.status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-ongoing {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-ended {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
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

.series-overview {
  font-size: 16px;
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 15px;
}

.creators {
  margin-bottom: 25px;
  font-size: 14px;
}

.creators-label {
  color: #999;
}

.creators-names {
  color: white;
  font-weight: 500;
}

.action-buttons {
  margin-bottom: 40px;
}

.start-watching-btn {
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

.start-watching-btn:hover {
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

.seasons-section, .episodes-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: white;
}

.seasons-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.season-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.season-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.season-poster {
  width: 60px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.season-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.season-placeholder {
  width: 100%;
  height: 100%;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #999;
}

.season-info {
  flex: 1;
}

.season-name {
  margin: 0 0 5px;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.season-episodes {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.episode-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  align-items: flex-start;
}

.episode-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.episode-number {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.episode-info {
  flex: 1;
}

.episode-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.episode-overview {
  margin: 0 0 8px;
  font-size: 14px;
  color: #ccc;
  line-height: 1.4;
}

.episode-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.episode-watched-btn {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.episode-watched-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.episode-watched-btn.watched {
  background: #22c55e;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .series-info {
    padding: 15px;
  }
  
  .series-title {
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
}

@media (max-width: 480px) {
  .detail-header {
    padding: 15px;
  }
  
  .series-info {
    padding: 15px;
    margin-top: -80px;
  }
  
  .series-title {
    font-size: 24px;
  }
  
  .series-poster-overlay {
    width: 80px;
    height: 120px;
    bottom: 15px;
    left: 15px;
  }
}
</style>