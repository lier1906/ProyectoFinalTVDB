import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue')
    },
    {
      path: '/watchlist',
      name: 'watchlist',
      component: () => import('@/views/WatchlistView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/watched',
      name: 'watched',
      component: () => import('@/views/WatchedView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/series/:id',
      name: 'series-detail',
      component: () => import('@/views/SeriesDetailView.vue'),
      props: true
    },
    {
      path: '/movie/:id',
      name: 'movie-detail',
      component: () => import('@/views/MovieDetailView.vue'),
      props: true
    },
    // Ruta genérica que detecta automáticamente si es serie o película
    {
      path: '/detail/:id',
      name: 'auto-detail',
      component: () => import('@/views/AutoDetailView.vue'),
      props: true
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router