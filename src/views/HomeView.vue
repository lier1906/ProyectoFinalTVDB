<template>
  <div class="home-view">
    <!-- Header con Search y Profile -->
    <div class="top-header">
      <div class="search-container">
        <Search class="search-icon" />
        <input 
          v-model="searchQuery" 
          @input="handleSearch"
          placeholder="Search" 
          class="search-input"
        />
      </div>
      <div class="profile-avatar">
        <User class="user-icon" />
      </div>
    </div>

    <!-- Content Sections -->
    <div class="content-sections">
      <!-- Recommended Movies Section -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">Recommended movies</h2>
          <ChevronRight class="section-arrow" />
        </div>
        
        <div v-if="moviesStore.loading" class="loading-container">
          <LoadingSpinner size="md" />
        </div>
        
        <div v-else class="horizontal-scroll">
          <div 
            v-for="movie in moviesStore.trendingMovies" 
            :key="movie.id"
            class="movie-card"
            @click="goToMovieDetail(movie.id)"
          >
            <div class="movie-poster">
              <div v-if="movie.poster" class="poster-container">
                <img 
                  :src="movie.poster" 
                  :alt="movie.name"
                  @load="() => onImageLoad(movie)"
                  @error="(e) => onImageError(e, movie)"
                  :style="{ display: movie.imageLoaded !== false ? 'block' : 'none' }"
                />
                <div v-if="movie.imageLoaded === false" class="poster-placeholder">
                  <Film class="placeholder-icon" />
                </div>
              </div>
              <div v-else class="poster-placeholder">
                <Film class="placeholder-icon" />
              </div>
              <div class="rating-badge">{{ movie.rating?.toFixed(1) || 'N/A' }}</div>
            </div>
            <h3 class="movie-title">{{ movie.name }}</h3>
          </div>
        </div>
      </section>

      <!-- Popular TV Series Section -->
      <section class="content-section">
        <div class="section-header">
          <h2 class="section-title">Popular TV series</h2>
          <ChevronRight class="section-arrow" />
        </div>
        
        <div v-if="seriesStore.loading" class="loading-container">
          <LoadingSpinner size="md" />
        </div>
        
        <div v-else class="horizontal-scroll">
          <div 
            v-for="series in seriesStore.trendingSeries.slice(0, 10)" 
            :key="series.id"
            class="series-card"
            @click="goToSeriesDetail(series.id)"
          >
            <div class="series-poster">
              <div v-if="series.poster" class="poster-container">
                <img 
                  :src="series.poster" 
                  :alt="series.name"
                  @load="() => onImageLoad(series)"
                  @error="(e) => onImageError(e, series)"
                  :style="{ display: series.imageLoaded !== false ? 'block' : 'none' }"
                />
                <div v-if="series.imageLoaded === false" class="poster-placeholder">
                  <Tv class="placeholder-icon" />
                </div>
              </div>
              <div v-else class="poster-placeholder">
                <Tv class="placeholder-icon" />
              </div>
              <div class="rating-badge">{{ series.rating?.toFixed(1) || 'N/A' }}</div>
            </div>
            <h3 class="series-title">{{ series.name }}</h3>
          </div>
        </div>
      </section>
    </div>

    <!-- Bottom Navigation Unificada -->
    <BottomNavigation />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, User, ChevronRight, Tv, Film } from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import BottomNavigation from '@/components/BottomNavigation.vue'
import { useSeriesStore } from '@/stores/series'
import { useMoviesStore } from '@/stores/movies'

const router = useRouter()
const seriesStore = useSeriesStore()
const moviesStore = useMoviesStore()

const searchQuery = ref('')

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: 'search', query: { q: searchQuery.value } })
  }
}

const goToSeriesDetail = (seriesId) => {
  router.push({ name: 'series-detail', params: { id: seriesId } })
}

const goToMovieDetail = (movieId) => {
  router.push({ name: 'movie-detail', params: { id: movieId } })
}

// Funciones para manejar carga de imágenes
const onImageLoad = (item) => {
  item.imageLoaded = true
}

const onImageError = (event, item) => {
  event.target.style.display = 'none'
  item.imageLoaded = false
}

onMounted(() => {
  // Cargar tanto series como películas del API
  seriesStore.fetchTrendingSeries()
  moviesStore.fetchTrendingMovies()
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: #1a1a1a;
  color: white;
  padding-bottom: 80px;
  position: relative;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #1a1a1a;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-container {
  flex: 1;
  position: relative;
  max-width: 300px;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 20px;
  height: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 20px 12px 45px;
  background: #2a2a2a;
  border: none;
  border-radius: 25px;
  color: white;
  font-size: 16px;
}

.search-input::placeholder {
  color: #666;
}

.search-input:focus {
  outline: none;
  background: #333;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 15px;
}

.user-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.content-sections {
  padding: 0 20px;
}

.content-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.section-arrow {
  width: 20px;
  height: 20px;
  color: #666;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.horizontal-scroll {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding-bottom: 10px;
  scroll-behavior: smooth;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.movie-card, .series-card {
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.movie-card:hover, .series-card:hover {
  transform: scale(1.05);
}

.movie-poster, .series-poster {
  position: relative;
  width: 140px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #333;
}

.poster-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.movie-poster img, .series-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
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
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #FFD700;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.movie-title, .series-title {
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin: 0;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  transition: opacity 0.3s ease;
  min-height: 1.2em;
}

/* Responsive */
@media (max-width: 768px) {
  .top-header {
    padding: 15px;
  }
  
  .content-sections {
    padding: 0 15px;
  }
  
  .movie-poster, .series-poster {
    width: 120px;
    height: 170px;
  }
  
  .movie-title, .series-title {
    max-width: 120px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .movie-poster, .series-poster {
    width: 100px;
    height: 150px;
  }
  
  .movie-title, .series-title {
    max-width: 100px;
    font-size: 12px;
  }
}
</style>