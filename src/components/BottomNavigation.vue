<template>
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
</template>

<script setup>
import { Compass, Clock, Check, Heart } from 'lucide-vue-next'
</script>

<style scoped>
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
</style>