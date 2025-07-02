// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import tursoDb from '@/services/tursoDb'
import localStorageService from '@/services/localStorage'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)

  // Acción: intenta iniciar sesión
  async function login(email, password) {
    try {
      // verifyUserCredentials devuelve el objeto user si coincide, o null
      const userData = await tursoDb.verifyUserCredentials(email, password)
      if (!userData) {
        // credenciales inválidas
        return false
      }
      // guardamos en el store y en localStorage
      user.value = {
        id: String(userData.id),  // convertimos a string si fuera BigInt
        email: userData.email,
        name: userData.name
      }
      localStorageService.setItem('user', user.value)
      localStorageService.setItem('isAuthenticated', true)
      
      console.log('✅ Login successful:', user.value)
      return true
    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    }
  }

  // Acción: registra un nuevo usuario y lo deja logueado
  async function register(email, password, name) {
    try {
      // createUser retorna el id como string
      const userId = await tursoDb.createUser(email, password, name)
      user.value = {
        id: userId,
        email,
        name
      }
      localStorageService.setItem('user', user.value)
      localStorageService.setItem('isAuthenticated', true)
      
      console.log('✅ Registration successful:', user.value)
      return true
    } catch (error) {
      console.error('❌ Register error:', error)
      throw error
    }
  }

  // Acción: cierra sesión
  function logout() {
    console.log('🚪 Logging out user')
    user.value = null
    localStorageService.removeItem('user')
    localStorageService.removeItem('isAuthenticated')
    
    // Limpiar otros datos del localStorage relacionados con el usuario
    localStorageService.removeItem('favorites')
    localStorageService.removeItem('watchlist')
    localStorageService.removeItem('watchedEpisodes')
  }

  // Inicializa el estado leyendo del localStorage
  function initAuth() {
    const saved = localStorageService.getItem('user')
    const isAuth = localStorageService.getItem('isAuthenticated')
    
    if (saved && isAuth) {
      user.value = saved
      console.log('🔄 Restored user session:', user.value)
    } else {
      console.log('📝 No saved session found')
    }
  }

  // Método para actualizar información del usuario
  function updateUser(newUserData) {
    if (user.value) {
      user.value = { ...user.value, ...newUserData }
      localStorageService.setItem('user', user.value)
    }
  }

  return {
    // state
    user,
    isAuthenticated,
    // actions
    login,
    register,
    logout,
    initAuth,
    updateUser
  }
})