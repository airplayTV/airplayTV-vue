<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue'
import AppVideoList from '@/components/AppVideoList.vue'
import { onMounted, ref } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import { computeWindowWidthColumn } from '@/helpers/utils.ts'

const windowWidth = ref(0)
const cols = ref(2)
onMounted(() => {
  window.onresize = () => {
    const { _column, _windowWidth } = computeWindowWidthColumn()
    windowWidth.value = _windowWidth
    cols.value = _column
  }
  const { _column, _windowWidth } = computeWindowWidthColumn()
  windowWidth.value = _windowWidth
  cols.value = _column
})
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
