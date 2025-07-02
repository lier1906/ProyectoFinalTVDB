<template>
  <div class="auto-detail">
    <!-- Loading mientras determina el tipo -->
    <div v-if="loading" class="loading-container">
      <LoadingSpinner size="lg" />
      <p>Loading content...</p>
    </div>

    <!-- Error si no se puede determinar el tipo -->
    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <h2>Content Not Found</h2>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="retryLoad">Try Again</button>
        <button class="back-btn" @click="goBack">Go Back</button>
      </div>
    </div>

    <!-- Renderiza el componente apropiado -->
    <SeriesDetailView v-else-if="contentType === 'series'" />
    <MovieDetailView v-else-if="contentType === 'movie'" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import SeriesDetailView from './SeriesDetailView.vue'
import MovieDetailView from './MovieDetailView.vue'
import { useSeriesStore } from '@/stores/series'
import { useMoviesStore } from '@/stores/movies'
import tvdbApi from '@/services/tvdbApi'

const route = useRoute()
const router = useRouter()
const seriesStore = useSeriesStore()
const moviesStore = useMoviesStore()

const loading = ref(true)
const error = ref(null)
const contentType = ref(null) // 'series' | 'movie'

const detectContentType = async () => {
  try {
    loading.value = true
    error.value = null
    
    const id = route.params.id
    if (!id) {
      throw new Error('No content ID provided')
    }

    console.log('🔍 Detecting content type for ID:', id)

    // Primero buscar en los stores locales
    const seriesItem = seriesStore.getSeriesById(id) || 
                       seriesStore.searchResults.find(s => s.id == id)
    const movieItem = moviesStore.getMovieById(id) || 
                      moviesStore.searchResults.find(m => m.id == id)

    if (seriesItem) {
      console.log('✅ Found in series store')
      contentType.value = 'series'
      return
    }

    if (movieItem) {
      console.log('✅ Found in movies store')
      contentType.value = 'movie'
      return
    }

    // Si no está en los stores, intentar con la API
    console.log('🔍 Not found in stores, trying API...')
    
    // Intentar primero como serie
    try {
      await tvdbApi.getSeriesById(id)
      console.log('✅ Confirmed as series via API')
      contentType.value = 'series'
      return
    } catch (seriesError) {
      console.log('❌ Not a series:', seriesError.message)
    }

    // Intentar como película
    try {
      await tvdbApi.getMovieById(id)
      console.log('✅ Confirmed as movie via API')
      contentType.value = 'movie'
      return
    } catch (movieError) {
      console.log('❌ Not a movie:', movieError.message)
    }

    // Si no es ni serie ni película, asumir que es serie por defecto
    console.log('⚠️ Could not determine type, defaulting to series')
    contentType.value = 'series'

  } catch (err) {
    console.error('❌ Error detecting content type:', err)
    error.value = err.message || 'Unable to load content'
  } finally {
    loading.value = false
  }
}

const retryLoad = () => {
  detectContentType()
}

const goBack = () => {
  router.go(-1)
}

// Watch for route changes
watch(() => route.params.id, () => {
  if (route.params.id) {
    detectContentType()
  }
})

onMounted(() => {
  if (route.params.id) {
    detectContentType()
  } else {
    error.value = 'No content ID provided'
    loading.value = false
  }
})
</script>

<style scoped>
.auto-detail {
  min-height: 100vh;
  background: #0F0F23;
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

.loading-container p {
  margin-top: 20px;
  color: #666;
  font-size: 16px;
}

.error-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.error-card h2 {
  margin: 0 0 15px;
  font-size: 24px;
  color: white;
}

.error-message {
  color: #ff6b6b;
  margin: 15px 0 25px;
  font-size: 16px;
  line-height: 1.5;
}

.retry-btn, .back-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  margin: 0 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
}

.retry-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}
</style>