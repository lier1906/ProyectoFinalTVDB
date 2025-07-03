<template>
  <div class="watchlist-view">
    <!-- Header -->
    <div class="watchlist-header">
      <button @click="goBack" class="back-button">
        <ArrowLeft class="back-icon" />
      </button>
      <h1 class="page-title">My Shows</h1>
      <button class="menu-button">
        <MoreVertical class="menu-icon" />
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <LoadingSpinner size="lg" />
      <p>Loading watchlist...</p>
    </div>

    <div v-else-if="!authStore.isAuthenticated" class="auth-required">
      <div class="auth-card">
        <div class="auth-icon">🔒</div>
        <h2>Sign in to view watchlist</h2>
        <p>Create an account to save shows you want to watch</p>
        <router-link to="/login" class="btn btn-primary">Sign In</router-link>
      </div>
    </div>

    <div v-else-if="isEmpty" class="empty-container">
      <div class="empty-card">
        <div class="empty-icon">📺</div>
        <h2>Your watchlist is empty</h2>
        <p>Add shows you want to watch later to keep track of them.</p>
        <button class="explore-btn" @click="$router.push('/')">
          Explore Shows
        </button>
      </div>
    </div>

    <div v-else class="watchlist-content">
      <!-- Stats -->
      <div class="stats-section">
        <div class="stat-item">
          <span class="stat-number">{{ watchlistStore.watchlist.length }}</span>
          <span class="stat-label">To Watch</span>
        </div>
      </div>

      <!-- Watchlist Grid -->
      <div class="watchlist-grid">
        <div 
          v-for="item in watchlistStore.watchlist" 
          :key="item.series_id" 
          class="watchlist-card"
          @click="goToSeriesDetail(item)"
        >
          <div class="card-poster">
            <img
              v-if="item.series_poster"
              :src="item.series_poster"
              :alt="item.series_name"
              @error="handleImageError"
            />
            <div v-else class="poster-placeholder">
              <Tv class="placeholder-icon" />
            </div>
            
            <!-- Watchlist indicator -->
            <div class="watchlist-indicator">
              <Clock class="clock-icon" />
            </div>
            
            <!-- Action buttons -->
            <div class="card-actions">
              <button 
                class="action-btn favorite-btn"
                @click.stop="moveToFavorites(item.series_id)"
                title="Move to favorites"
              >
                <Heart class="action-icon" />
              </button>
              <button 
                class="action-btn remove-btn"
                @click.stop="removeFromWatchlist(item.series_id)"
                title="Remove from watchlist"
              >
                <X class="action-icon" />
              </button>
            </div>
          </div>
          
          <div class="card-info">
            <h3 class="card-title">{{ item.series_name }}</h3>
            <p class="card-date">Added {{ formatDate(item.added_at) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.name === 'home' }">
        <Compass class="nav-icon" />
        <span class="nav-label">Explore</span>
      </router-link>
      
      <router-link to="/watchlist" class="nav-item" :class="{ active: $route.name === 'watchlist' }">
        <Clock class="nav-icon" />
        <span class="nav-label">My shows</span>
      </router-link>
      
      <router-link to="/watched" class="nav-item" :class="{ active: $route.name === 'watched' }">
        <Calendar class="nav-icon" />
        <span class="nav-label">Calendar</span>
      </router-link>
      
      <router-link to="/favorites" class="nav-item" :class="{ active: $route.name === 'favorites' }">
        <Bell class="nav-icon" />
        <span class="nav-label">Notifications</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, MoreVertical, Tv, Clock, Heart, X, 
  Compass, Calendar, Bell 
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
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
    uiStore.showToast('Removed from watchlist', 'success')
  } catch (error) {
    uiStore.showToast('Error removing from watchlist', 'error')
  }
}

const moveToFavorites = async (seriesId) => {
  try {
    // Obtener los datos de la serie
    const seriesData = await tvdbApi.getSeriesById(seriesId)
    
    // Remover de watchlist
    await watchlistStore.removeFromWatchlist(seriesId)
    
    // Agregar a favoritos
    await favoritesStore.addToFavorites(seriesData)
    
    uiStore.showToast('Moved to favorites', 'success')
  } catch (error) {
    console.error('Error moving to favorites:', error)
    uiStore.showToast('Error moving to favorites', 'error')
  }
}

const goToSeriesDetail = (item) => {
  console.log('🔗 Navigating to detail for watchlist item:', item)
  
  // Determinar el tipo basado en item_type
  if (item.item_type === 'movie') {
    console.log('🎬 Going to movie detail')
    router.push({ name: 'movie-detail', params: { id: item.series_id } })
  } else {
    console.log('📺 Going to series detail')
    router.push({ name: 'series-detail', params: { id: item.series_id } })
  }
}

const goBack = () => {
  router.go(-1)
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  } catch {
    return dateString
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
  background: #1a1a1a;
  color: white;
  padding-bottom: 80px;
}

.watchlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}

.back-button, .menu-button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.back-icon, .menu-icon {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #666;
}

.auth-required {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  max-width: 300px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.auth-card h2 {
  color: white;
  margin-bottom: 10px;
  font-size: 20px;
}

.auth-card p {
  color: #999;
  margin-bottom: 25px;
  font-size: 14px;
  line-height: 1.5;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #17a2b8;
  color: white;
}

.btn-primary:hover {
  background: #138496;
  transform: translateY(-1px);
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.empty-card {
  text-align: center;
  max-width: 300px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-card h2 {
  color: white;
  margin-bottom: 10px;
  font-size: 20px;
}

.empty-card p {
  color: #999;
  margin-bottom: 25px;
  line-height: 1.5;
}

.explore-btn {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.explore-btn:hover {
  background: #138496;
  transform: translateY(-1px);
}

.watchlist-content {
  padding: 20px;
}

.stats-section {
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #17a2b8;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.watchlist-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.watchlist-card:hover {
  transform: scale(1.05);
}

.card-poster {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
  background: #333;
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
}

.placeholder-icon {
  width: 40px;
  height: 40px;
  color: white;
  opacity: 0.7;
}

.watchlist-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clock-icon {
  width: 14px;
  height: 14px;
  color: #17a2b8;
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.watchlist-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.favorite-btn {
  background: rgba(231, 76, 60, 0.8);
}

.remove-btn {
  background: rgba(0, 0, 0, 0.8);
}

.action-icon {
  width: 12px;
  height: 12px;
  color: white;
}

.card-info {
  text-align: center;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 4px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-date {
  font-size: 11px;
  color: #666;
  margin: 0;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #666;
  transition: color 0.2s ease;
  padding: 8px 12px;
}

.nav-item.active {
  color: #667eea;
}

.nav-item:hover {
  color: #999;
}

.nav-item.active:hover {
  color: #667eea;
}

.nav-icon {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 480px) {
  .watchlist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .card-poster {
    height: 180px;
  }
  
  .watchlist-content {
    padding: 15px;
  }
  
  .watchlist-header {
    padding: 15px;
  }
}
</style>