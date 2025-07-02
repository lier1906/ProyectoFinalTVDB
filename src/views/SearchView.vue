<template>
  <div class="search-view">
    <!-- Header -->
    <div class="search-header">
      <button @click="goBack" class="back-button">
        <ArrowLeft class="back-icon" />
      </button>
      <h1 class="search-title">Search shows</h1>
      <button class="filter-button">
        <SlidersHorizontal class="filter-icon" />
      </button>
    </div>

    <!-- Content Tabs -->
    <div class="content-tabs">
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'series' }"
        @click="switchTab('series')"
      >
        <Tv class="tab-icon" />
        TV series
      </button>
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'movies' }"
        @click="switchTab('movies')"
      >
        <Film class="tab-icon" />
        Movies
      </button>
    </div>

    <!-- Results Counter -->
    <div class="results-info" v-if="!isLoading && (currentResults.length > 0 || searchPerformed)">
      <span class="results-count">{{ currentResults.length }} {{ activeTab === 'series' ? 'series' : 'movies' }}</span>
      <button class="selection-mode-btn">
        <Check class="selection-icon" />
        Selection mode
      </button>
    </div>

    <!-- Search Input -->
    <div class="search-input-container">
      <Search class="search-icon" />
      <input
        v-model="q"
        @input="onInput"
        @keyup.enter="doSearch"
        type="text"
        :placeholder="activeTab === 'series' ? 'Search TV series...' : 'Search movies...'"
        class="search-input"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <LoadingSpinner size="lg"/>
    </div>

    <!-- Results Grid -->
    <div v-else-if="currentResults.length > 0" class="results-section">
      <div class="results-grid">
        <div 
          v-for="item in currentResults" 
          :key="item.id"
          class="result-card"
          @click="goToDetail(item.id)"
        >
          <div class="card-poster">
            <div v-if="item.poster" class="poster-container">
              <img 
                :src="item.poster" 
                :alt="item.name"
                @load="() => onImageLoad(item)"
                @error="(e) => onImageError(e, item)"
                :style="{ display: item.imageLoaded !== false ? 'block' : 'none' }"
              />
              <div v-if="item.imageLoaded === false" class="poster-placeholder">
                <component :is="activeTab === 'series' ? Tv : Film" class="placeholder-icon" />
              </div>
            </div>
            <div v-else class="poster-placeholder">
              <component :is="activeTab === 'series' ? Tv : Film" class="placeholder-icon" />
            </div>
            
            <!-- Rating badge -->
            <div class="rating-badge" v-if="item.rating">
              {{ item.rating.toFixed(1) }}
            </div>
            <!-- Year badge -->
            <div class="year-badge" v-if="item.year">
              {{ item.year }}
            </div>
            <!-- Type badge -->
            <div class="type-badge">
              {{ activeTab === 'series' ? 'TV' : 'Movie' }}
            </div>
          </div>
          <h3 class="card-title">{{ item.name }}</h3>
          <p class="card-year">{{ item.year || 'Unknown' }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="searchPerformed && !isLoading" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">No results found</h3>
      <p class="empty-message">Try a different search term for {{ activeTab === 'series' ? 'TV series' : 'movies' }}</p>
    </div>

    <!-- Initial State -->
    <div v-else class="initial-state">
      <div class="initial-icon">
        <Search class="search-placeholder-icon" />
      </div>
      <h3 class="initial-title">Search for {{ activeTab === 'series' ? 'TV series' : 'movies' }}</h3>
      <p class="initial-message">Enter a title to start searching</p>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, SlidersHorizontal, Tv, Film, Check, Search
} from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import BottomNavigation from '@/components/BottomNavigation.vue'
import { useSeriesStore } from '@/stores/series'
import { useMoviesStore } from '@/stores/movies'

const router = useRouter()
const seriesStore = useSeriesStore()
const moviesStore = useMoviesStore()

const q = ref('')
const activeTab = ref('series')
const searchPerformed = ref(false)

let debounceTimeout = null

// Computed properties
const isLoading = computed(() => {
  return activeTab.value === 'series' ? seriesStore.searchLoading : moviesStore.searchLoading
})

const currentResults = computed(() => {
  return activeTab.value === 'series' ? seriesStore.searchResults : moviesStore.searchResults
})

// Methods
const onInput = () => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    doSearch()
  }, 300)
}

const doSearch = async () => {
  if (q.value.trim()) {
    searchPerformed.value = true
    
    if (activeTab.value === 'series') {
      await seriesStore.searchSeries(q.value)
    } else {
      await moviesStore.searchMovies(q.value)
    }
  } else {
    searchPerformed.value = false
    clearSearch()
  }
}

const switchTab = (tab) => {
  activeTab.value = tab
  if (q.value.trim()) {
    doSearch()
  }
}

const clearSearch = () => {
  seriesStore.clearSearch()
  moviesStore.clearSearch()
}

const goToDetail = (itemId) => {
  // Determinar si es serie o película basado en el tab activo
  if (activeTab.value === 'series') {
    router.push({ name: 'series-detail', params: { id: itemId } })
  } else {
    router.push({ name: 'movie-detail', params: { id: itemId } })
  }
}

const goBack = () => {
  router.go(-1)
}

// Funciones para manejar carga de imágenes
const onImageLoad = (item) => {
  item.imageLoaded = true
}

const onImageError = (event, item) => {
  event.target.style.display = 'none'
  item.imageLoaded = false
}

// Limpiar búsqueda cuando cambia el tab
watch(activeTab, () => {
  if (q.value.trim()) {
    doSearch()
  }
})
</script>

<style scoped>
.search-view {
  min-height: 100vh;
  background: #1a1a1a;
  color: white;
  padding-bottom: 80px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}

.back-button, .filter-button {
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

.back-icon, .filter-icon {
  width: 20px;
  height: 20px;
}

.search-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content-tabs {
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

.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 15px;
}

.results-count {
  font-size: 14px;
  color: #999;
}

.selection-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 6px 12px;
  border-radius: 16px;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.selection-icon {
  width: 14px;
  height: 14px;
}

.search-input-container {
  position: relative;
  padding: 0 20px 20px;
}

.search-icon {
  position: absolute;
  left: 35px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 20px;
  height: 20px;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 15px 20px 15px 50px;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 12px;
  color: white;
  font-size: 16px;
}

.search-input::placeholder {
  color: #666;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  background: #333;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.results-section {
  padding: 0 20px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.result-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.result-card:hover {
  transform: scale(1.05);
}

.card-poster {
  position: relative;
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.poster-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.card-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #333;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
}

.placeholder-icon {
  width: 40px;
  height: 40px;
  color: white;
  opacity: 0.7;
}

.rating-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.8);
  color: #FFD700;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.year-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.type-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(102, 126, 234, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  min-height: 1.2em;
}

.card-year {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.empty-state, .initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon, .initial-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.search-placeholder-icon {
  width: 48px;
  height: 48px;
  color: #666;
}

.empty-title, .initial-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: white;
}

.empty-message, .initial-message {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .card-poster {
    height: 180px;
  }
  
  .card-title {
    font-size: 12px;
  }
  
  .search-header {
    padding: 15px;
  }
  
  .content-tabs {
    padding: 0 15px;
  }
  
  .search-input-container {
    padding: 0 15px 15px;
  }
  
  .results-section {
    padding: 0 15px;
  }
}
</style>