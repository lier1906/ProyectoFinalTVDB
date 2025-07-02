<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
    <SeriesCard
      v-for="serie in series"
      :key="serie.id"
      :series="serie"
    />
  </div>
</template>

<script setup>
import SeriesCard from './SeriesCard.vue'

const props = defineProps({
  series: {
    type: Array,
    required: true
  }
})
</script>
