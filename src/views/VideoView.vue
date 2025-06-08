<script setup>
import AppHeader from '../components/AppHeader.vue'
import AppVideoList from '@/components/AppVideoList.vue'
import AppVideo from '@/components/AppVideo.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 0 10px">
        <AppVideo />
      </div>
    </div>

    <AppFooter />
  </div>
</template>
