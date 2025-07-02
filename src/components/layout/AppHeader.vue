<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <router-link to="/" class="flex items-center space-x-2">
            <Tv class="h-8 w-8 text-primary-600" />
            <span class="text-xl font-bold text-gray-900">TV Tracker</span>
          </router-link>
        </div>

        <!-- Search Bar -->
        <div class="flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        <!-- User Menu -->
        <div class="flex items-center space-x-4">
          <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">
              Hola, {{ authStore.user.name }}
            </span>
            <button
              @click="handleLogout"
              class="btn btn-secondary"
            >
              <LogOut class="h-4 w-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
          <div v-else class="flex items-center space-x-2">
            <router-link to="/login" class="btn btn-secondary">
              Iniciar Sesión
            </router-link>
            <router-link to="/register" class="btn btn-primary">
              Registrarse
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { Tv, LogOut } from 'lucide-vue-next'
import SearchBar from '@/components/SearchBar.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>