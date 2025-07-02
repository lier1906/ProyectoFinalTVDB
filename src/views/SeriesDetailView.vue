<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import tvdbApi from '@/services/tvdbApi'

export default {
  name: 'SeriesDetailView',
  setup() {
    const route = useRoute()
    const router = useRouter()

    const series = ref(null)
    const seasons = ref([])
    const episodes = ref([])
    const selectedSeason = ref(null)
    const loading = ref(false)
    const loadingEpisodes = ref(false)
    const error = ref(null)
    const debugInfo = ref(null)
    const currentEpisodePage = ref(0)
    const hasMoreEpisodes = ref(false)

    const favorites = ref(new Set())
    const watchlist = ref(new Set())

    const seriesId = computed(() => route.params.id)

    // --- Carga listas de localStorage ---
    const loadListsFromStorage = () => {
      const favs = localStorage.getItem('favorites')
      const watches = localStorage.getItem('watchlist')

      if (favs) {
        try {
          favorites.value = new Set(JSON.parse(favs))
        } catch {}
      }

      if (watches) {
        try {
          watchlist.value = new Set(JSON.parse(watches))
        } catch {}
      }
    }

    // --- Guarda listas en localStorage ---
    const saveListsToStorage = () => {
      localStorage.setItem('favorites', JSON.stringify(Array.from(favorites.value)))
      localStorage.setItem('watchlist', JSON.stringify(Array.from(watchlist.value)))
    }

    // --- Computed para saber si la serie está marcada ---
    const isFavorite = computed(() => {
      if (!series.value) return false
      return favorites.value.has(series.value.id)
    })

    const isWatchlist = computed(() => {
      if (!series.value) return false
      return watchlist.value.has(series.value.id)
    })

    // --- Toggle para agregar o quitar ---
    const toggleFavorite = () => {
      if (!series.value) return
      const id = series.value.id
      if (favorites.value.has(id)) {
        favorites.value.delete(id)
      } else {
        favorites.value.add(id)
      }
      saveListsToStorage()
    }

    const toggleWatchlist = () => {
      if (!series.value) return
      const id = series.value.id
      if (watchlist.value.has(id)) {
        watchlist.value.delete(id)
      } else {
        watchlist.value.add(id)
      }
      saveListsToStorage()
    }

    // --- Validar y limpiar ID ---
    const validateSeriesId = () => {
      const id = seriesId.value
      if (!id) {
        throw new Error('ID de serie no proporcionado en la URL')
      }

      const numericMatch = String(id).match(/(\d+)$/)
      if (!numericMatch) {
        throw new Error(`ID de serie inválido: "${id}". No contiene un número válido.`)
      }

      const numericId = numericMatch[1]
      return numericId
    }

    // --- Carga detalles de la serie ---
    const loadSeriesDetails = async () => {
      try {
        loading.value = true
        error.value = null
        debugInfo.value = null

        const validId = validateSeriesId()

        if (process.env.NODE_ENV === 'development') {
          debugInfo.value = await tvdbApi.debugSeriesId(validId)
        }

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

        if (!debugInfo.value && seriesId.value) {
          try {
            debugInfo.value = await tvdbApi.debugSeriesId(seriesId.value)
          } catch {}
        }
      } finally {
        loading.value = false
      }
    }

    // --- Carga episodios ---
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

    const loadMoreEpisodes = async () => {
      if (!hasMoreEpisodes.value || loadingEpisodes.value) return
      const nextPage = currentEpisodePage.value + 1
      await loadEpisodes(seriesId.value, nextPage)
    }

    const selectSeason = (season) => {
      selectedSeason.value = season
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

    const formatDate = (dateString) => {
      if (!dateString) return 'Fecha desconocida'

      try {
        return new Date(dateString).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch {
        return dateString
      }
    }

    watch(() => route.params.id, () => {
      if (route.params.id) {
        loadSeriesDetails()
      }
    })

    onMounted(() => {
      loadListsFromStorage()
      if (seriesId.value) {
        loadSeriesDetails()
      } else {
        error.value = 'No se proporcionó un ID de serie válido'
      }
    })

    const statusClass = computed(() => {
      if (!series.value?.status) return ''
      const status = series.value.status.toLowerCase()
      if (status.includes('continuing') || status.includes('ongoing')) return 'status-ongoing'
      if (status.includes('ended') || status.includes('completed')) return 'status-ended'
      return 'status-unknown'
    })

    const displayedEpisodes = computed(() => {
      if (selectedSeason.value) {
        return selectedSeason.value.episodes || []
      }
      return episodes.value
    })

    return {
      series,
      seasons,
      episodes,
      selectedSeason,
      loading,
      loadingEpisodes,
      error,
      debugInfo,
      hasMoreEpisodes,
      statusClass,
      displayedEpisodes,
      selectSeason,
      loadMoreEpisodes,
      retryLoad,
      goBack,
      handleImageError,
      formatDate,
      isFavorite,
      isWatchlist,
      toggleFavorite,
      toggleWatchlist
    }
  }
}
</script>

<template>
  <div class="series-detail">
    <button class="back-btn" @click="goBack">← Volver</button>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando detalles...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <h2>Error</h2>
        <p class="error-message">{{ error }}</p>
        <div v-if="debugInfo" class="error-details">
          <pre>{{ debugInfo }}</pre>
        </div>
        <div class="error-actions">
          <button class="retry-btn" @click="retryLoad">Reintentar</button>
          <button class="back-btn" @click="goBack">Volver</button>
        </div>
      </div>
    </div>

    <div v-else-if="series">
      <div class="series-header">
        <div class="series-poster">
          <img
            v-if="series.poster"
            :src="series.poster"
            :alt="series.name"
            @error="handleImageError"
          />
          <div v-else class="poster-placeholder">🎬</div>
        </div>

        <div class="series-info">
          <h1 class="series-title">{{ series.name }}</h1>

          <!-- Íconos favoritos y watchlist -->
          <div class="action-icons">
            <button
              class="icon-btn"
              :class="{ active: isFavorite }"
              @click="toggleFavorite"
              :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
            >
              ❤️
            </button>
            <button
              class="icon-btn"
              :class="{ active: isWatchlist }"
              @click="toggleWatchlist"
              :title="isWatchlist ? 'Quitar de watchlist' : 'Agregar a watchlist'"
            >
              ⏰
            </button>
          </div>

          <div class="series-meta">
            <span class="meta-item" :class="statusClass">{{ series.status }}</span>
            <span class="meta-item rating">⭐ {{ series.rating.toFixed(1) }}</span>
            <span v-if="series.firstAired" class="meta-item">Primera emisión: {{ formatDate(series.firstAired) }}</span>
            <span v-if="series.lastAired" class="meta-item">Última emisión: {{ formatDate(series.lastAired) }}</span>
          </div>

          <div class="genres">
            <span v-for="genre in series.genres" :key="genre" class="genre-tag">{{ genre }}</span>
          </div>

          <p class="series-overview">{{ series.overview }}</p>
        </div>
      </div>

      <section class="seasons-section">
        <h2>Temporadas</h2>
        <div class="seasons-grid">
          <div
            v-for="season in seasons"
            :key="season.id"
            class="season-card"
            :class="{ active: selectedSeason && selectedSeason.id === season.id }"
            @click="selectSeason(season)"
          >
            <div class="season-image">
              <img v-if="season.image" :src="season.image" :alt="season.name" @error="handleImageError" />
              <div v-else class="season-placeholder">📺</div>
            </div>
            <h3>{{ season.name || `Temporada ${season.number}` }}</h3>
            <p>{{ season.overview || 'Sin descripción' }}</p>
          </div>
        </div>
      </section>

      <section class="episodes-section" v-if="displayedEpisodes.length">
        <h2>Episodios</h2>
        <div class="episodes-list">
          <div v-for="episode in displayedEpisodes" :key="episode.id" class="episode-card">
            <div class="episode-number">{{ episode.number }}</div>
            <div class="episode-content">
              <h4 class="episode-title">{{ episode.name }}</h4>
              <p class="episode-overview">{{ episode.overview || 'Sin descripción' }}</p>
              <div class="episode-meta">
                <span v-if="episode.firstAired">Fecha: {{ formatDate(episode.firstAired) }}</span>
                <span v-if="episode.runtime">Duración: {{ episode.runtime }} min</span>
              </div>
            </div>
          </div>
        </div>

        <div class="load-more-section" v-if="hasMoreEpisodes">
          <button class="load-more-btn" :disabled="loadingEpisodes" @click="loadMoreEpisodes">
            {{ loadingEpisodes ? 'Cargando...' : 'Cargar más episodios' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.series-detail {
  min-height: 100vh;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.error-card {
  background: #fff;
  border: 1px solid #dc3545;
  border-radius: 8px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
}

.error-message {
  color: #dc3545;
  margin: 15px 0;
  font-size: 16px;
}

.error-details {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin: 20px 0;
  font-size: 12px;
}

.error-details pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.retry-btn, .back-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn {
  background: #007bff;
  color: white;
}

.back-btn {
  background: #6c757d;
  color: white;
}

.series-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.series-poster img, .poster-placeholder {
  width: 200px;
  height: 300px;
  border-radius: 8px;
  object-fit: cover;
}

.poster-placeholder {
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #6c757d;
}

.series-info {
  flex: 1;
}

.series-title {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

/* Aquí los iconos para favoritos y watchlist */
.action-icons {
  margin: 15px 0;
  display: flex;
  gap: 20px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #888;
  transition: color 0.3s ease;
  user-select: none;
  padding: 0;
}

.icon-btn:hover {
  color: #007bff;
}

.icon-btn.active {
  color: #e0245e; /* rojo para favorito */
}

.icon-btn.active:nth-child(2) {
  color: #17a2b8; /* azul para watchlist */
}

.series-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.meta-item {
  padding: 5px 12px;
  background: #e9ecef;
  border-radius: 20px;
  font-size: 14px;
}

.status-ongoing { background: #d4edda; color: #155724; }
.status-ended { background: #f8d7da; color: #721c24; }
.rating { background: #fff3cd; color: #856404; }

.genres {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.genre-tag {
  padding: 4px 10px;
  background: #007bff;
  color: white;
  border-radius: 15px;
  font-size: 12px;
}

.series-overview {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 25px;
}

.series-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}

.detail-item {
  font-size: 14px;
  color: #666;
}

.seasons-section, .episodes-section {
  margin-top: 40px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.seasons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.season-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.season-card:hover, .season-card.active {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.15);
}

.season-image img, .season-placeholder {
  width: 100%;
  height: 120px;
  border-radius: 4px;
  object-fit: cover;
}

.season-placeholder {
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #6c757d;
}

.episodes-list {
  margin-top: 20px;
}

.episode-card {
  display: flex;
  gap: 15px;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 15px;
}

.episode-number {
  font-size: 24px;
  font-weight: bold;
  width: 50px;
  color: #007bff;
  text-align: center;
}

.episode-content {
  flex: 1;
}

.episode-title {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.episode-overview {
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
}

.episode-meta {
  font-size: 12px;
  color: #888;
  display: flex;
  gap: 15px;
}

.load-more-section {
  text-align: center;
  margin-top: 25px;
}

.load-more-btn {
  background: #007bff;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.load-more-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>
