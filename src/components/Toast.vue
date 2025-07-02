<template>
  <div v-if="uiStore.toast.show" 
       class="fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg border border-gray-200">
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <CheckCircle v-if="uiStore.toast.type === 'success'" class="h-6 w-6 text-green-500" />
          <AlertCircle v-else-if="uiStore.toast.type === 'error'" class="h-6 w-6 text-red-500" />
          <Info v-else class="h-6 w-6 text-blue-500" />
        </div>
        <div class="ml-3 w-0 flex-1">
          <p class="text-sm font-medium text-gray-900">
            {{ uiStore.toast.message }}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button @click="uiStore.hideToast" class="text-gray-400 hover:text-gray-500">
            <X class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CheckCircle, AlertCircle, Info, X } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
</script>