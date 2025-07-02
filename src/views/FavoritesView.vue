<template>
  <div class="favorites-view">
    <!-- Header -->
    <div class="favorites-header">
      <button @click="goBack" class="back-button">
        <ArrowLeft class="back-icon" />
      </button>
      <h1 class="page-title">Favorites</h1>
      <button class="menu-button">
        <MoreVertical class="menu-icon" />
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <LoadingSpinner size="lg" />
      <p>Loading favorites...</p>
    </div>

    <div v-else-if="!authStore.isAuthenticated" class="auth-required">
      <div class="auth-card">
        <div class="auth-icon">🔒</div>
        <h2>Sign in to view favorites</h2>
        <p>Create an account to save your favorite series</p>
        <router-link to="/login" class="btn btn-primary">Sign In</router-link>
      </div>
    </div>

    <div v-else-if="isEmpty" class="empty-container">
      <div class="empty-card">
        <div class="empty-icon">💔</div>
        <h2>No favorites yet</h2>
        <p>Explore series and add the ones you love to your favorites list.</p>
        <button class="explore-btn" @click="$router.push('/')">
          Explore Series
        </button>
      </div>
    </div>

    <div v-else class="favorites-content">
      <!-- Stats -->
      <div class="stats-section">
        <div class="stat-item">
          <span class="stat-number">{{ favoritesStore.favorites.length }}</span>
          <span class="stat-label">Favorites</span>
        </div>
      </div>

      <!-- Favorites Grid -->
      <div class="favorites-grid">
        <div 
          v-for="favorite in favoritesStore.favorites" 
          :key="favorite.series_id" 
          class="favorite-card"
          @click="goToSeriesDetail(favorite.series_id)"
        >
          <div class="card-poster">
            <img
              v-if="favorite.series_poster"
              :src="favorite.series_poster"
              :alt="favorite.series_name"
              @error="handleImageError"
            />
            <div v-else class="poster-placeholder">
              <Tv class="placeholder-icon" />
            </div>
            
            <!-- Favorite indicator -->
            <div class="favorite-indicator">
              <Heart class="heart-icon filled" />
            </div>
            
            <!-- Remove button -->
            <button 
              class="remove-btn"
              @click.stop="removeFromFavorites(favorite.series_id)"
              title="Remove from favorites"
            >
              <X class="remove-icon" />
            </button>
          </div>
          
          <div class="card-info">
            <h3 class="card-title">{{ favorite.series_name }}</h3>
            <p class="card-date">Added {{ formatDate(favorite.added_at) }}</p>
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
  ArrowLeft, MoreVertical, Tv, Heart, X, 
  Compass, Clock, Calendar, Bell 
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const favoritesStore = useFavoritesStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

const loading = computed(() => favoritesStore.loading)
const isEmpty = computed(() => 
  authStore.isAuthenticated && favoritesStore.favorites.length === 0
)

const removeFromFavorites = async (seriesId) => {
  try {
    await favoritesStore.removeFromFavorites(seriesId)
    uiStore.showToast('Removed from favorites', 'success')
  } catch (error) {
    uiStore.showToast('Error removing from favorites', 'error')
  }
}

const goToSeriesDetail = (itemId, itemType = 'series') => {
  if (itemType === 'movie') {
    router.push({ name: 'movie-detail', params: { id: itemId } })
  } else {
    router.push({ name: 'series-detail', params: { id: itemId } })
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
    favoritesStore.loadFavorites()
  }
})
</script>

<style scoped>
.favorites-view {
  min-height: 100vh;
  background: #1a1a1a;
  color: white;
  padding-bottom: 80px;
}

.favorites-header {
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
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
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
  background: #667eea;
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
  background: #5a67d8;
  transform: translateY(-1px);
}

.favorites-content {
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
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.favorite-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.favorite-card:hover {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.placeholder-icon {
  width: 40px;
  height: 40px;
  color: white;
  opacity: 0.7;
}

.favorite-indicator {
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

.heart-icon {
  width: 14px;
  height: 14px;
  color: #e74c3c;
}

.heart-icon.filled {
  fill: #e74c3c;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.favorite-card:hover .remove-btn {
  opacity: 1;
}

.remove-icon {
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
  .favorites-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .card-poster {
    height: 180px;
  }
  
  .favorites-content {
    padding: 15px;
  }
  
  .favorites-header {
    padding: 15px;
  }
}
</style>