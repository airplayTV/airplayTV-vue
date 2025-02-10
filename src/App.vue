<script lang="ts">
import { defineComponent } from 'vue'
import {
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  NSkeleton,
  NSpace,
  NSpin
} from 'naive-ui'
// import { useAppStore } from '@/stores/app.ts'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'

export default defineComponent({
  components: {
    NSkeleton,
    NSpace,
    NSpin,
    NLoadingBarProvider,
    NNotificationProvider,
    NMessageProvider
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    return {
      sourceList
    }
  }
})
</script>

<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-notification-provider>
        <div class="container">
          <div v-if="!sourceList" class="padding-20px">
            <n-skeleton text :repeat="2" />
            <n-skeleton text style="width: 60%" />
          </div>
          <RouterView v-else />
        </div>
      </n-notification-provider>
    </n-message-provider>
  </n-loading-bar-provider>
</template>

<style scoped></style>
