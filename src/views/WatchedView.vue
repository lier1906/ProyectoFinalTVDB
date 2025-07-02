<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import tvdbApi from '@/services/tvdbApi'
import { useAuthStore } from '@/stores/auth' // Asumiendo que tienes un store de autenticación

export default {
  name: 'WatchedView',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    const watchedItems = ref([])
    const watchedDetails = ref([])
    const loading = ref(false)
    const error = ref(null)
    const searchQuery = ref('')
    const sortBy = ref('id') // id (más reciente), series_name, season_number
    const filterBy = ref('all') // all, series, episodes
    const groupBy = ref('series') // series, episodes

    // --- Cargar contenido visto desde la API/base de datos ---
    const loadWatchedFromDB = async () => {
      try {
        loading.value = true
        error.value = null

        // Aquí harías la llamada a tu API para obtener los datos de la tabla 'watched'
        // Por ejemplo:
        // const response = await api.get(`/users/${authStore.user.id}/watched`)
        // watchedItems.value = response.data

        // Simulación de datos según tu estructura de DB:
        const mockWatchedData = [
          {
            id: 1,
            user_id: authStore.user?.id || 1,
            series_id: 12345,
            episode_id: 67890,
            series_name: "Breaking Bad",
            episode_name: "Pilot",
            season_number: 1
          },
          {
            id: 2,
            user_id: authStore.user?.id || 1,
            series_id: 12345,
            episode_id: 67891,
            series_name: "Breaking Bad",
            episode_name: "Cat's in the Bag...",
            season_number: 1
          }
        ]
        
        watchedItems.value = mockWatchedData
        await loadWatchedDetails()

      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    // --- Agregar episodio a visto ---
    const addEpisodeToWatched = async (seriesId, episodeId, seriesName, episodeName, seasonNumber) => {
      try {
        const watchedData = {
          user_id: authStore.user.id,
          series_id: seriesId,
          episode_id: episodeId,
          series_name: seriesName,
          episode_name: episodeName,
          season_number: seasonNumber
        }

        // Llamada a la API para insertar en la base de datos
        // const response = await api.post('/watched', watchedData)
        
        // Simulación: agregar localmente
        const newItem = {
          id: Date.now(), // En la DB sería autoincrement
          ...watchedData
        }
        
        watchedItems.value.unshift(newItem)
        await loadWatchedDetails()

      } catch (err) {
        console.error('Error agregando episodio a visto:', err)
      }
    }

    // --- Quitar episodio de visto ---
    const removeEpisodeFromWatched = async (watchedId) => {
      try {
        // await api.delete(`/watched/${watchedId}`)
        watchedItems.value = watchedItems.value.filter(item => item.id !== watchedId)
        await loadWatchedDetails()
      } catch (err) {
        console.error('Error quitando episodio de visto:', err)
      }
    }

    // --- Marcar serie completa como vista ---
    const markSeriesAsWatched = async (seriesId) => {
      try {
        // Obtener todos los episodios de la serie
        const seriesData = await tvdbApi.getSeriesById(seriesId, true)
        const episodes = await tvdbApi.getSeriesEpisodes(seriesId)
        
        for (const episode of episodes.episodes) {
          if (!isEpisodeWatched(episode.id)) {
            await addEpisodeToWatched(
              seriesId,
              episode.id,
              seriesData.name,
              episode.name,
              episode.seasonNumber || 1
            )
          }
        }
      } catch (err) {
        console.error('Error marcando serie como vista:', err)
      }
    }

    // --- Verificar si un episodio está visto ---
    const isEpisodeWatched = (episodeId) => {
      return watchedItems.value.some(item => item.episode_id === episodeId)
    }

    // --- Verificar si una serie está completamente vista ---
    const isSeriesWatched = (seriesId) => {
      const seriesEpisodes = watchedItems.value.filter(item => item.series_id === seriesId)
      return seriesEpisodes.length > 0
    }

    // --- Cargar detalles adicionales ---
    const loadWatchedDetails = async () => {
      if (watchedItems.value.length === 0) {
        watchedDetails.value = []
        return
      }

      try {
        const uniqueSeries = [...new Set(watchedItems.value.map(item => item.series_id))]
        const seriesDetails = []

        for (const seriesId of uniqueSeries) {
          try {
            const seriesData = await tvdbApi.getSeriesById(seriesId)
            const seriesWatchedItems = watchedItems.value.filter(item => item.series_id === seriesId)
            
            seriesDetails.push({
              ...seriesData,
              watchedEpisodes: seriesWatchedItems,
              totalWatchedEpisodes: seriesWatchedItems.length,
              lastWatchedId: Math.max(...seriesWatchedItems.map(item => item.id))
            })
          } catch (err) {
            console.warn(`Error cargando detalles para serie ${seriesId}:`, err)
          }
        }

        watchedDetails.value = seriesDetails
      } catch (err) {
        console.error('Error cargando detalles:', err)
      }
    }

    // --- Estadísticas ---
    const watchedStats = computed(() => {
      const totalEpisodes = watchedItems.value.length
      const uniqueSeries = new Set(watchedItems.value.map(item => item.series_id)).size
      const lastWatched = watchedItems.value.length > 0 
        ? watchedItems.value.reduce((latest, item) => 
            item.id > latest.id ? item : latest
          )
        : null

      return {
        totalEpisodes,
        uniqueSeries,
        lastWatched
      }
    })

    // --- Computed para filtrar y agrupar ---
    const filteredAndGroupedItems = computed(() => {
      let items = groupBy.value === 'series' ? watchedDetails.value : watchedItems.value

      // Filtrar por búsqueda
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        if (groupBy.value === 'series') {
          items = items.filter(item => 
            item.name?.toLowerCase().includes(query)
          )
        } else {
          items = items.filter(item => 
            item.series_name?.toLowerCase().includes(query) ||
            item.episode_name?.toLowerCase().includes(query)
          )
        }
      }

      // Ordenar
      items.sort((a, b) => {
        switch (sortBy.value) {
          case 'series_name':
            const nameA = groupBy.value === 'series' ? a.name : a.series_name
            const nameB = groupBy.value === 'series' ? b.name : b.series_name
            return (nameA || '').localeCompare(nameB || '')
          case 'season_number':
            if (groupBy.value === 'episodes') {
              return (a.season_number || 0) - (b.season_number || 0)
            }
            return 0
          case 'id':
          default:
            const idA = groupBy.value === 'series' ? a.lastWatchedId : a.id
            const idB = groupBy.value === 'series' ? b.lastWatchedId : b.id
            return (idB || 0) - (idA || 0)
        }
      })

      return items
    })

    // --- Navegación ---
    const goToSeriesDetail = (seriesId) => {
      router.push(`/series/${seriesId}`)
    }

    const goBack = () => {
      router.go(-1)
    }

    // --- Limpiar todo el historial ---
    const clearAllWatched = async () => {
      if (confirm('¿Estás seguro de que quieres eliminar todo tu historial de visualización?')) {
        try {
          // await api.delete(`/users/${authStore.user.id}/watched`)
          watchedItems.value = []
          watchedDetails.value = []
        } catch (err) {
          console.error('Error limpiando historial:', err)
        }
      }
    }

    // --- Lifecycle ---
    onMounted(() => {
      loadWatchedFromDB()
    })

    return {
      watchedItems,
      watchedDetails,
      loading,
      error,
      searchQuery,
      sortBy,
      filterBy,
      groupBy,
      filteredAndGroupedItems,
      watchedStats,
      addEpisodeToWatched,
      removeEpisodeFromWatched,
      markSeriesAsWatched,
      isEpisodeWatched,
      isSeriesWatched,
      goToSeriesDetail,
      goBack,
      clearAllWatched,
      loadWatchedFromDB
    }
  }
}
</script>

<template>
  <div class="watched-view">
    <div class="header">
      <button class="back-btn" @click="goBack">← Volver</button>
      <h1>Historial de Visualización</h1>
    </div>

    <!-- Estadísticas -->
    <div class="stats-card">
      <div class="stat-item">
        <span class="stat-number">{{ watchedStats.totalEpisodes }}</span>
        <span class="stat-label">Episodios vistos</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ watchedStats.uniqueSeries }}</span>
        <span class="stat-label">Series diferentes</span>
      </div>
      <div class="stat-item" v-if="watchedStats.lastWatched">
        <span class="stat-number">{{ watchedStats.lastWatched.series_name }}</span>
        <span class="stat-label">Última vista</span>
      </div>
    </div>

    <div class="controls">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="groupBy === 'series' ? 'Buscar series...' : 'Buscar episodios...'"
          class="search-input"
        />
      </div>

      <div class="filters">
        <select v-model="groupBy" class="filter-select">
          <option value="series">Agrupar por Series</option>
          <option value="episodes">Ver Episodios</option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="id">Más reciente</option>
          <option value="series_name">Nombre</option>
          <option v-if="groupBy === 'episodes'" value="season_number">Temporada</option>
        </select>

        <button
          v-if="watchedItems.length > 0"
          @click="clearAllWatched"
          class="clear-btn"
        >
          Limpiar Historial
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando historial...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <h2>Error</h2>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="loadWatchedFromDB">Reintentar</button>
      </div>
    </div>

    <div v-else-if="filteredAndGroupedItems.length === 0" class="empty-state">
      <div class="empty-card">
        <div class="empty-icon">📺</div>
        <h2>No hay historial de visualización</h2>
        <p v-if="searchQuery">No se encontraron resultados para "{{ searchQuery }}"</p>
        <p v-else>Aún no has marcado ningún episodio como visto.</p>
        <p>¡Comienza viendo series y marcando episodios!</p>
      </div>
    </div>

    <!-- Vista agrupada por series -->
    <div v-else-if="groupBy === 'series'" class="series-grid">
      <div
        v-for="series in filteredAndGroupedItems"
        :key="series.id"
        class="series-card"
        @click="goToSeriesDetail(series.id)"
      >
        <div class="card-image">
          <img
            v-if="series.poster"
            :src="series.poster"
            :alt="series.name"
            @error="$event.target.style.display = 'none'"
          />
          <div v-else class="image-placeholder">📺</div>
          <div class="episodes-badge">
            {{ series.totalWatchedEpisodes }} episodios
          </div>
        </div>

        <div class="card-content">
          <h3 class="card-title">{{ series.name }}</h3>
          
          <div class="card-meta">
            <span v-if="series.rating" class="rating">⭐ {{ series.rating.toFixed(1) }}</span>
            <span class="episode-count">{{ series.totalWatchedEpisodes }} episodios vistos</span>
          </div>

          <div class="recent-episodes">
            <h4>Episodios recientes:</h4>
            <div 
              v-for="episode in series.watchedEpisodes.slice(0, 3)" 
              :key="episode.id"
              class="episode-item"
            >
              <span class="season">T{{ episode.season_number }}</span>
              <span class="episode-name">{{ episode.episode_name }}</span>
              <button
                @click.stop="removeEpisodeFromWatched(episode.id)"
                class="remove-episode-btn"
                title="Marcar como no visto"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista de episodios individuales -->
    <div v-else class="episodes-list">
      <div
        v-for="episode in filteredAndGroupedItems"
        :key="episode.id"
        class="episode-card"
      >
        <div class="episode-info">
          <div class="series-info">
            <h3 class="series-name">{{ episode.series_name }}</h3>
            <span class="season-number">Temporada {{ episode.season_number }}</span>
          </div>
          
          <div class="episode-details">
            <h4 class="episode-name">{{ episode.episode_name }}</h4>
            <div class="episode-meta">
              <span class="watched-id">Visto #{{ episode.id }}</span>
            </div>
          </div>
        </div>

        <div class="episode-actions">
          <button
            @click="goToSeriesDetail(episode.series_id)"
            class="view-series-btn"
          >
            Ver Serie
          </button>
          <button
            @click="removeEpisodeFromWatched(episode.id)"
            class="remove-btn"
            title="Marcar como no visto"
          >
            ✕ Quitar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.watched-view {
  min-height: 100vh;
  padding: 20px;
  background: #f8f9fa;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0;
}

.back-btn {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background: #5a6268;
}

.stats-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.stat-label {
  color: #6c757d;
  font-size: 14px;
}

.controls {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.search-bar {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.clear-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.clear-btn:hover {
  background: #c82333;
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

.error-container, .empty-state {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.error-card, .empty-card {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.error-card {
  border: 1px solid #dc3545;
}

.error-message {
  color: #dc3545;
  margin: 15px 0;
  font-size: 16px;
}

.retry-btn {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-card h2 {
  color: #6c757d;
  margin-bottom: 15px;
}

.empty-card p {
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 10px;
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.series-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.series-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #6c757d;
}

.episodes-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 123, 255, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.card-content {
  padding: 20px;
}

.card-title {
  font-size: 1.2rem;
  margin: 0 0 10px;
  color: #2c3e50;
}

.card-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 14px;
}

.rating {
  color: #ffc107;
  font-weight: bold;
}

.episode-count {
  color: #6c757d;
}

.recent-episodes h4 {
  font-size: 14px;
  margin-bottom: 10px;
  color: #495057;
}

.episode-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 13px;
}

.season {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}

.episode-name {
  flex: 1;
  color: #495057;
}

.remove-episode-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.episode-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.episode-info {
  flex: 1;
}

.series-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.series-name {
  margin: 0;
  color: #007bff;
  font-size: 1.1rem;
}

.season-number {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #495057;
}

.episode-name {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
}

.episode-meta {
  margin-top: 5px;
}

.watched-id {
  color: #6c757d;
  font-size: 12px;
}

.episode-actions {
  display: flex;
  gap: 10px;
}

.view-series-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.view-series-btn:hover {
  background: #0056b3;
}

.remove-btn:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .series-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select, .clear-btn {
    width: 100%;
  }

  .episode-card {
    flex-direction: column;
    align-items: stretch;
  }

  .episode-actions {
    justify-content: space-between;
  }
}
</style>