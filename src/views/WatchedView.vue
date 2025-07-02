<template>
  <div class="watched-view">
    <!-- Header -->
    <div class="watched-header">
      <button @click="goBack" class="back-button">
        <ArrowLeft class="back-icon" />
      </button>
      <h1 class="page-title">Watched</h1>
      <button class="menu-button" @click="clearAllWatched">
        <Trash2 class="menu-icon" />
      </button>
    </div>

    <!-- Tab Filters -->
    <div class="filter-tabs">
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'series' }"
        @click="activeTab = 'series'"
      >
        <Tv class="tab-icon" />
        Series
      </button>
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'episodes' }"
        @click="activeTab = 'episodes'"
      >
        <PlayCircle class="tab-icon" />
        Episodes
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <LoadingSpinner size="lg" />
      <p>Loading watched content...</p>
    </div>

    <div v-else-if="!authStore.isAuthenticated" class="auth-required">
      <div class="auth-card">
        <div class="auth-icon">🔒</div>
        <h2>Sign in to view history</h2>
        <p>Track your watched episodes and series</p>
        <router-link to="/login" class="btn btn-primary">Sign In</router-link>
      </div>
    </div>

    <div v-else-if="isEmpty" class="empty-container">
      <div class="empty-card">
        <div class="empty-icon">📺</div>
        <h2>No watched content yet</h2>
        <p>Start watching episodes and they'll appear here.</p>
        <button class="explore-btn" @click="$router.push('/')">
          Explore Shows
        </button>
      </div>
    </div>

    <div v-else class="watched-content">
      <!-- Stats -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">{{ watchedStats.totalEpisodes }}</span>
            <span class="stat-label">Episodes</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ watchedStats.uniqueSeries }}</span>
            <span class="stat-label">Series</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ watchedStats.hoursWatched }}</span>
            <span class="stat-label">Hours</span>
          </div>
        </div>
      </div>

      <!-- Series Tab Content -->
      <div v-if="activeTab === 'series'" class="series-section">
        <div class="watched-grid">
          <div 
            v-for="series in watchedStore.watchedSeries" 
            :key="series.series_id" 
            class="watched-card"
            @click="goToSeriesDetail(series.series_id)"
          >
            <div class="card-poster">
              <div class="poster-placeholder">
                <Tv class="placeholder-icon" />
              </div>
              
              <!-- Episodes count badge -->
              <div class="episodes-badge">
                {{ series.episodes.length }} ep
              </div>
              
              <!-- Progress indicator -->
              <div class="progress-indicator">
                <Check class="check-icon" />
              </div>
            </div>
            
            <div class="card-info">
              <h3 class="card-title">{{ series.series_name }}</h3>
              <p class="card-episodes">{{ series.episodes.length }} watched</p>
              <p class="card-date">Last: {{ formatDate(series.lastWatched) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Episodes Tab Content -->
      <div v-else class="episodes-section">
        <div class="episodes-list">
          <div 
            v-for="episode in displayedEpisodes" 
            :key="episode.id"
            class="episode-item"
            @click="goToSeriesDetail(episode.series_id)"
          >
            <div class="episode-number">
              {{ episode.episode_number || 'E?' }}
            </div>
            
            <div class="episode-info">
              <h4 class="episode-series">{{ episode.series_name }}</h4>
              <p class="episode-title">{{ episode.episode_name }}</p>
              <div class="episode-meta">
                <span class="season">S{{ episode.season_number || '?' }}</span>
                <span class="watched-date">{{ formatDate(episode.watched_at) }}</span>
              </div>
            </div>

            <button 
              class="unwatch-btn"
              @click.stop="markAsUnwatched(episode.episode_id)"
              title="Mark as unwatched"
            >
              <X class="unwatch-icon" />
            </button>
          </div>
          
          <!-- Load more button -->
          <div v-if="watchedStore.watchedEpisodes.length > 50" class="load-more-container">
            <button class="load-more-btn" @click="showAllEpisodes = !showAllEpisodes">
              {{ showAllEpisodes ? 'Show less' : `Show all ${watchedStore.watchedEpisodes.length} episodes` }}
            </button>
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
        <span class="nav-label">Watchlist</span>
      </router-link>
      
      <router-link to="/watched" class="nav-item" :class="{ active: $route.name === 'watched' }">
        <Check class="nav-icon" />
        <span class="nav-label">Watched</span>
      </router-link>
      
      <router-link to="/favorites" class="nav-item" :class="{ active: $route.name === 'favorites' }">
        <Heart class="nav-icon" />
        <span class="nav-label">Favorites</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, Trash2, Tv, PlayCircle, Check, X, 
  Compass, Clock, Heart
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useWatchedStore } from '@/stores/watched'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const router = useRouter()
const watchedStore = useWatchedStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

const activeTab = ref('series')
const showAllEpisodes = ref(false)
const loading = computed(() => watchedStore.loading)

const isEmpty = computed(() => 
  authStore.isAuthenticated && watchedStore.watchedEpisodes.length === 0
)

const displayedEpisodes = computed(() => {
  const episodes = watchedStore.watchedEpisodes
  if (showAllEpisodes.value || episodes.length <= 50) {
    return episodes
  }
  return episodes.slice(0, 50)
})

const watchedStats = computed(() => {
  const totalEpisodes = watchedStore.watchedEpisodes.length
  const uniqueSeries = new Set(watchedStore.watchedEpisodes.map(ep => ep.series_id)).size
  // Estimamos 45 minutos por episodio
  const hoursWatched = Math.round((totalEpisodes * 45) / 60)
  
  return {
    totalEpisodes,
    uniqueSeries,
    hoursWatched
  }
})

const markAsUnwatched = async (episodeId) => {
  try {
    await watchedStore.markAsUnwatched(episodeId)
    uiStore.showToast('Episode marked as unwatched', 'success')
  } catch (error) {
    uiStore.showToast('Error updating episode status', 'error')
  }
}

const clearAllWatched = async () => {
  if (!confirm('Are you sure you want to clear your entire watch history? This action cannot be undone.')) {
    return
  }
  
  try {
    await watchedStore.clearWatchedEpisodes()
    uiStore.showToast('Watch history cleared', 'success')
  } catch (error) {
    uiStore.showToast('Error clearing watch history', 'error')
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
    watchedStore.loadWatchedEpisodes()
  }
})
</script>

<style scoped>
.watched-view {
  min-height: 100vh;
  background: #1a1a1a;
  color: white;
  padding-bottom: 80px;
}

.watched-header {
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

.menu-button {
  background: rgba(239, 68, 68, 0.2);
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

.filter-tabs {
  display: flex;
  padding: 0 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px;
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-icon {
  width: 20px;
  height: 20px;
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

.watched-content {
  padding: 0 20px 20px;
}

.stats-section {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
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
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.watched-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.watched-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.watched-card:hover {
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

.episodes-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.progress-indicator {
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background: rgba(34, 197, 94, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  width: 14px;
  height: 14px;
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

.card-episodes {
  font-size: 11px;
  color: #22c55e;
  margin: 0 0 2px;
}

.card-date {
  font-size: 11px;
  color: #666;
  margin: 0;
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.episode-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  font-size: 12px;
  flex-shrink: 0;
}

.episode-info {
  flex: 1;
}

.episode-series {
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px;
}

.episode-title {
  font-size: 13px;
  color: #ccc;
  margin: 0 0 6px;
}

.episode-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.season {
  color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.watched-date {
  color: #999;
}

.unwatch-btn {
  width: 32px;
  height: 32px;
  background: rgba(239, 68, 68, 0.2);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.unwatch-btn:hover {
  background: rgba(239, 68, 68, 0.4);
}

.unwatch-icon {
  width: 16px;
  height: 16px;
  color: #ef4444;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.load-more-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background: rgba(255, 255, 255, 0.2);
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
  .watched-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .card-poster {
    height: 180px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .watched-content {
    padding: 0 15px 15px;
  }
  
  .watched-header {
    padding: 15px;
  }
  
  .filter-tabs {
    padding: 0 15px;
  }
  
  .nav-label {
    font-size: 10px;
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 768px) {
  .watched-header {
    padding: 15px;
  }
  
  .watched-content {
    padding: 0 15px 15px;
  }
  
  .filter-tabs {
    padding: 0 15px;
  }
}
</style>