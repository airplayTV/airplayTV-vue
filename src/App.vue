<script lang="ts">
import { defineComponent } from 'vue'
import { NSkeleton, NSpace, NSpin, NLoadingBarProvider } from 'naive-ui'
// import { useAppStore } from '@/stores/app.ts'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'

export default defineComponent({
  components: {
    NSkeleton,
    NSpace,
    NSpin,
    NLoadingBarProvider,
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    return {
      sourceList,
    }
  },
})
</script>

<template>
  <n-loading-bar-provider>
    <div class="container">
      <div v-if="!sourceList" class="padding-20px">
        <n-skeleton text :repeat="2" />
        <n-skeleton text style="width: 60%" />
      </div>
      <RouterView v-else />
    </div>
  </n-loading-bar-provider>
</template>

<style scoped></style>
