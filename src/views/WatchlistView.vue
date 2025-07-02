<template>
  <div class="watchlist-view">
    <div class="watchlist-header">
      <h1 class="page-title">⏰ Mi Lista para Ver</h1>
      <button class="reload-btn" @click="reloadWatchlist" :disabled="loading">
        🔄 Actualizar
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando lista para ver...</p>
    </div>

    <div v-else-if="!authStore.isAuthenticated" class="auth-required">
      <div class="auth-card">
        <h2>Inicia sesión para ver tu watchlist</h2>
        <p>Necesitas una cuenta para guardar tu lista de series por ver</p>
        <router-link to="/login" class="btn btn-primary">Iniciar Sesión</router-link>
      </div>
    </div>

    <div v-else-if="isEmpty" class="empty-container">
      <div class="empty-card">
        <div class="empty-icon">📺</div>
        <h2>Tu lista para ver está vacía</h2>
        <p>Agrega series que quieras ver más tarde a tu watchlist para no olvidarlas.</p>
        <button class="explore-btn" @click="$router.push('/')">
          Explorar Series
        </button>
      </div>
    </div>

    <div v-else class="watchlist-grid">
      <div 
        v-for="item in watchlistStore.watchlist" 
        :key="item.series_id" 
        class="series-card"
        @click="goToSeriesDetail(item.series_id)"
      >
        <div class="series-poster">
          <img
            v-if="item.series_poster"
            :src="item.series_poster"
            :alt="item.series_name"
            @error="handleImageError"
          />
          <div v-else class="poster-placeholder">🎬</div>
        </div>

        <div class="series-info">
          <h3 class="series-title">{{ item.series_name }}</h3>
          
          <div class="series-meta">
            <span class="meta-item">
              Agregado: {{ formatDate(item.added_at) }}
            </span>
          </div>

          <div class="card-actions">
            <button 
              class="detail-btn"
              @click.stop="goToSeriesDetail(item.series_id)"
            >
              Ver Detalles
            </button>
            <button 
              class="favorite-btn"
              @click.stop="moveToFavorites(item.series_id)"
              title="Marcar como vista y mover a favoritos"
            >
              ❤️
            </button>
            <button 
              class="remove-btn"
              @click.stop="removeFromWatchlist(item.series_id)"
              title="Quitar de lista para ver"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWatchlistStore } from '@/stores/watchlist'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import tvdbApi from '@/services/tvdbApi'

const router = useRouter()
const watchlistStore = useWatchlistStore()
const favoritesStore = useFavoritesStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

const loading = computed(() => watchlistStore.loading)
const isEmpty = computed(() => 
  authStore.isAuthenticated && watchlistStore.watchlist.length === 0
)

const removeFromWatchlist = async (seriesId) => {
  try {
    await watchlistStore.removeFromWatchlist(seriesId)
    uiStore.showToast('Serie removida de la watchlist', 'success')
  } catch (error) {
    uiStore.showToast('Error al remover de watchlist', 'error')
  }
}

const moveToFavorites = async (seriesId) => {
  try {
    // Primero obtener los datos de la serie
    const seriesData = await tvdbApi.getSeriesById(seriesId)
    
    // Remover de watchlist
    await watchlistStore.removeFromWatchlist(seriesId)
    
    // Agregar a favoritos
    await favoritesStore.addToFavorites(seriesData)
    
    uiStore.showToast('Serie movida a favoritos', 'success')
  } catch (error) {
    console.error('Error moving to favorites:', error)
    uiStore.showToast('Error al mover a favoritos', 'error')
  }
}

const goToSeriesDetail = (seriesId) => {
  router.push(`/series/${seriesId}`)
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

const reloadWatchlist = async () => {
  if (authStore.isAuthenticated) {
    await watchlistStore.loadWatchlist()
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    watchlistStore.loadWatchlist()
  }
})
</script>

<style scoped>
.watchlist-view {
  min-height: 100vh;
  padding: 20px;
  background: #f8f9fa;
}

.watchlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.page-title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0;
}

.reload-btn {
  background: #17a2b8;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.reload-btn:hover:not(:disabled) {
  background: #138496;
}

.reload-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
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
  border-top: 4px solid #17a2b8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-required {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 50px 40px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 500px;
}

.auth-card h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.auth-card p {
  color: #6c757d;
  margin-bottom: 25px;
  line-height: 1.6;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background: #17a2b8;
  color: white;
}

.btn-primary:hover {
  background: #138496;
}

.empty-container {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.empty-card {
  background: white;
  border-radius: 12px;
  padding: 50px 40px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 500px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-card h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.empty-card p {
  color: #6c757d;
  margin-bottom: 25px;
  line-height: 1.6;
}

.explore-btn {
  background: #17a2b8;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.explore-btn:hover {
  background: #138496;
}

.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.series-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 20px;
  border-left: 4px solid #17a2b8;
}

.series-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.series-poster {
  flex-shrink: 0;
}

.series-poster img, .poster-placeholder {
  width: 80px;
  height: 120px;
  border-radius: 6px;
  object-fit: cover;
}

.poster-placeholder {
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #6c757d;
}

.series-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.series-title {
  font-size: 1.25rem;
  margin: 0 0 10px;
  color: #2c3e50;
  line-height: 1.3;
}

.series-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.meta-item {
  padding: 3px 8px;
  background: #e9ecef;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: auto;
}

.detail-btn {
  background: #007bff;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  flex: 1;
  transition: background-color 0.3s ease;
}

.detail-btn:hover {
  background: #0056b3;
}

.favorite-btn {
  background: #28a745;
  color: white;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.favorite-btn:hover {
  background: #218838;
}

.remove-btn {
  background: #dc3545;
  color: white;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.remove-btn:hover {
  background: #c82333;
}

/* Responsive */
@media (max-width: 768px) {
  .watchlist-view {
    padding: 15px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .watchlist-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .watchlist-grid {
    grid-template-columns: 1fr;
  }
  
  .series-card {
    flex-direction: column;
    text-align: center;
  }
  
  .series-poster {
    align-self: center;
  }
  
  .series-poster img, .poster-placeholder {
    width: 120px;
    height: 180px;
  }
  
  .card-actions {
    flex-direction: row;
    gap: 8px;
  }
  
  .detail-btn {
    flex: 1;
  }
}</style>