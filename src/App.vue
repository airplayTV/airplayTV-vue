<script lang="ts">
import { defineComponent, onBeforeMount } from 'vue'
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
import { v4 as uuidv4 } from 'uuid'
import { getStorageSync, setStorageSync } from '@/helpers/utils.ts'
import { KEY_CLIENT_ID } from '@/helpers/constant.ts'
import { connect } from '@/helpers/websocket.ts'

const onBeforeMountHandler = () => {
  const clientId = getStorageSync(KEY_CLIENT_ID)
  if (!clientId) {
    setStorageSync(KEY_CLIENT_ID, uuidv4()?.replaceAll('-', ''))
  }

  console.log('[client-id]', getStorageSync(KEY_CLIENT_ID))

  connect()


}

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

    onBeforeMount(onBeforeMountHandler)

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
