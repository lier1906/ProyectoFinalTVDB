<template>
  <div class="flex justify-center items-center" :class="containerClass">
    <div class="animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" 
         :class="spinnerClass">
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const spinnerClass = computed(() => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  return sizes[props.size]
})

const containerClass = computed(() => {
  const sizes = {
    sm: 'py-2',
    md: 'py-4',
    lg: 'py-8'
  }
  return sizes[props.size]
})
</script>