<!-- src/App.vue -->
<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <AppLayout>
      <router-view />
    </AppLayout>
    <Toast />
  </div>
</template>

<script setup>
import { onBeforeMount, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import Toast from '@/components/Toast.vue'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { useWatchlistStore } from '@/stores/watchlist'
import { useWatchedStore } from '@/stores/watched'
import tursoDb from '@/services/tursoDb'

const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()
const watchlistStore = useWatchlistStore()
const watchedStore = useWatchedStore()

onBeforeMount(async () => {
  // Inicializar base de datos
  try {
    await tursoDb.initDatabase()
    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
  }

  // Restaurar sesión del usuario
  authStore.initAuth()
})

// Watcher para cargar datos cuando el usuario se autentica
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      try {
        console.log('🔄 Loading user data...')
        
        // Cargar datos del usuario autenticado
        await Promise.all([
          favoritesStore.loadFavorites(),
          watchlistStore.loadWatchlist(),
          watchedStore.loadWatchedEpisodes()
        ])
        
        console.log('✅ User data loaded successfully')
      } catch (error) {
        console.error('❌ Error loading user data:', error)
      }
    } else {
      // Limpiar datos cuando se cierra sesión
      favoritesStore.clearFavorites()
      watchlistStore.clearWatchlist()
      watchedStore.clearWatchedEpisodes()
    }
  },
  { immediate: true }
)
</script>