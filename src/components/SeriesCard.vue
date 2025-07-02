<template>
  <div class="card hover:shadow-lg transition-shadow duration-200" v-cloak>
    <div class="relative">
      <img
        :src="series.poster || '/placeholder-series.jpg'"
        :alt="series.name"
        class="w-full h-64 object-cover"
        @error="e => e.target.src = '/placeholder-series.jpg'"
      />
      <div
        class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 
               transition-opacity duration-200 flex items-center justify-center"
      >
        <button
          @click="goToDetail"
          class="opacity-0 hover:opacity-100 transition-opacity duration-200 
                 bg-white text-gray-900 px-4 py-2 rounded-md font-medium"
        >
          Ver Detalles
        </button>
      </div>
      
      <!-- Type badge -->
      <div class="absolute top-2 right-2 type-badge">
        {{ isMovie ? 'Movie' : 'TV' }}
      </div>
    </div>

    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-2 truncate">
        {{ series.name }}
      </h3>
      <p class="text-sm text-gray-600 mb-3 line-clamp-2">
        {{ series.overview }}
      </p>

      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">{{ series.year }}</span>
        <div class="flex items-center space-x-2">
          <button
            @click="toggleWatchlist"
            :class="isInWatchlist 
                      ? 'text-blue-600' : 'text-gray-400'"
            class="hover:text-blue-600 transition-colors"
            :title="isInWatchlist ? 'Quitar de watchlist' : 'Agregar a watchlist'"
          >
            <Clock class="h-5 w-5" />
          </button>
          <button
            @click="toggleFavorite"
            :class="isFavorite 
                      ? 'text-red-600' : 'text-gray-400'"
            class="hover:text-red-600 transition-colors"
            :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
          >
            <Heart class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Clock, Heart } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useWatchlistStore } from '@/stores/watchlist'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const props = defineProps({
  series: { type: Object, required: true }
})

const router = useRouter()
const watchlistStore = useWatchlistStore()
const favoritesStore = useFavoritesStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Computed para detectar si es película
const isMovie = computed(() => {
  return props.series.type === 'movie' || 
         props.series.releaseDate || 
         props.series.runtime ||
         (props.series.year && !props.series.firstAired)
})

// Computed para verificar estados
const isInWatchlist = computed(() => {
  return watchlistStore.isInWatchlist(props.series.id)
})

const isFavorite = computed(() => {
  return favoritesStore.isFavorite(props.series.id)
})

function goToDetail() {
  if (isMovie.value) {
    router.push({ name: 'movie-detail', params: { id: props.series.id } })
  } else {
    router.push({ name: 'series-detail', params: { id: props.series.id } })
  }
}

async function toggleWatchlist() {
  if (!authStore.isAuthenticated) { 
    router.push('/login')
    return
  }

  try {
    if (isInWatchlist.value) {
      await watchlistStore.removeFromWatchlist(props.series.id)
      uiStore.showToast(`${isMovie.value ? 'Movie' : 'Series'} removed from watchlist`, 'success')
    } else {
      // Asegurar que el objeto tenga el tipo correcto
      const itemToAdd = {
        ...props.series,
        type: isMovie.value ? 'movie' : 'series'
      }
      await watchlistStore.addToWatchlist(itemToAdd)
      uiStore.showToast(`${isMovie.value ? 'Movie' : 'Series'} added to watchlist`, 'success')
    }
  } catch (error) {
    console.error('Error toggling watchlist:', error)
    uiStore.showToast('Error updating watchlist', 'error')
  }
}

async function toggleFavorite() {
  if (!authStore.isAuthenticated) { 
    router.push('/login')
    return
  }

  try {
    if (isFavorite.value) {
      await favoritesStore.removeFromFavorites(props.series.id)
      uiStore.showToast(`${isMovie.value ? 'Movie' : 'Series'} removed from favorites`, 'success')
    } else {
      // Asegurar que el objeto tenga el tipo correcto
      const itemToAdd = {
        ...props.series,
        type: isMovie.value ? 'movie' : 'series'
      }
      await favoritesStore.addToFavorites(itemToAdd)
      uiStore.showToast(`${isMovie.value ? 'Movie' : 'Series'} added to favorites`, 'success')
    }
  } catch (error) {
    console.error('Error toggling favorites:', error)
    uiStore.showToast('Error updating favorites', 'error')
  }
}
</script>

<style scoped>
.type-badge {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>