<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue'
import AppVideoList from '@/components/AppVideoList.vue'
import { onMounted, ref } from 'vue'
import AppFooter from '@/components/AppFooter.vue'

const windowWidth = ref(0)
const cols = ref(2)
onMounted(() => {
  window.onresize = () => {
    computeWindowWidth()
  }
  computeWindowWidth()
})

const computeWindowWidth = () => {
  windowWidth.value = window.innerWidth
  console.log('[]', window.innerWidth)
  if (window.innerWidth <= 370) {
    cols.value = 1
  } else if (window.innerWidth <= 370 + 200) {
    cols.value = 2
  } else if (window.innerWidth <= 370 + 200 * 2) {
    cols.value = 3
  } else if (window.innerWidth <= 370 + 200 * 3) {
    cols.value = 4
  } else {
    cols.value = 5
  }
}
</script>

<template>
  <div>
    <AppHeader />
    <div style="padding: 0 10px">
      <AppVideoList :cols="cols" />
    </div>

    <AppFooter />
  </div>
</template>
