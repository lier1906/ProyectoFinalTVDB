<template>
  <nav class="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
    <div class="p-4">
      <ul class="space-y-2">
        <li>
          <router-link
            to="/"
            class="nav-link"
            :class="{ 'nav-link-active': $route.name === 'home' }"
          >
            <Home class="h-5 w-5" />
            Inicio
          </router-link>
        </li>
        <li>
          <router-link
            to="/search"
            class="nav-link"
            :class="{ 'nav-link-active': $route.name === 'search' }"
          >
            <Search class="h-5 w-5" />
            Buscar
          </router-link>
        </li>
        
        <template v-if="authStore.isAuthenticated">
          <li class="pt-4">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Mi Lista
            </h3>
          </li>
          <li>
            <router-link
              to="/watchlist"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'watchlist' }"
            >
              <Clock class="h-5 w-5" />
              Por Ver
            </router-link>
          </li>
          <li>
            <router-link
              to="/watched"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'watched' }"
            >
              <CheckCircle class="h-5 w-5" />
              Vistas
            </router-link>
          </li>
          <li>
            <router-link
              to="/favorites"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'favorites' }"
            >
              <Heart class="h-5 w-5" />
              Favoritas
            </router-link>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { Home, Search, Clock, CheckCircle, Heart } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style>
.nav-link {
  @apply flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200;
}

.nav-link-active {
  @apply bg-primary-50 text-primary-700 border-r-2 border-primary-600;
}
</style>