import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const toast = ref({
    show: false,
    message: '',
    type: 'info' // 'success', 'error', 'info'
  })

  const showToast = (message, type = 'info') => {
    toast.value = {
      show: true,
      message,
      type
    }
    
    setTimeout(() => {
      hideToast()
    }, 5000)
  }

  const hideToast = () => {
    toast.value.show = false
  }

  return {
    toast,
    showToast,
    hideToast
  }
})