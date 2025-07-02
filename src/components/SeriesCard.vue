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

// Computed para verificar estados
const isInWatchlist = computed(() => {
  return watchlistStore.isInWatchlist(props.series.id)
})

const isFavorite = computed(() => {
  return favoritesStore.isFavorite(props.series.id)
})

function goToDetail() {
  router.push({ name: 'series-detail', params: { id: props.series.id } })
}

async function toggleWatchlist() {
  if (!authStore.isAuthenticated) { 
    router.push('/login')
    return
  }

  try {
    if (isInWatchlist.value) {
      await watchlistStore.removeFromWatchlist(props.series.id)
      uiStore.showToast('Serie removida de la watchlist', 'success')
    } else {
      await watchlistStore.addToWatchlist(props.series)
      uiStore.showToast('Serie agregada a la watchlist', 'success')
    }
  } catch (error) {
    console.error('Error toggling watchlist:', error)
    uiStore.showToast('Error al actualizar watchlist', 'error')
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
      uiStore.showToast('Serie removida de favoritos', 'success')
    } else {
      await favoritesStore.addToFavorites(props.series)
      uiStore.showToast('Serie agregada a favoritos', 'success')
    }
  } catch (error) {
    console.error('Error toggling favorites:', error)
    uiStore.showToast('Error al actualizar favoritos', 'error')
  }
}
</script>