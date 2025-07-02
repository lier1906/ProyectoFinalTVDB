// src/main.js
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/style.css'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

const pinia = createPinia()

setActivePinia(pinia)

app.use(pinia)
app.use(router)

const authStore = useAuthStore()

authStore.initAuth()

app.mount('#app')
