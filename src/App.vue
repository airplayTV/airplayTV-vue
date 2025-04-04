<script lang="ts">
import { defineComponent, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import {
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  NSkeleton,
  NSpace,
  NSpin,
} from 'naive-ui'
// import { useAppStore } from '@/stores/app.ts'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'
import { v4 as uuidv4 } from 'uuid'
import { getCurrentSource, getStorageSync, setStorageSync } from '@/helpers/utils.ts'
import { KEY_CLIENT_ID } from '@/helpers/constant.ts'
import {
  addEventHandler,
  connect,
  ControlEvent,
  EventName,
  joinGroup,
  removeEventHandler,
} from '@/helpers/websocket.ts'
import { useRouter } from 'vue-router'

const _pageKey = '_key_app_page_app_'
const router = ref(null)

const onBeforeMountHandler = () => {
  const clientId = getStorageSync(KEY_CLIENT_ID)
  if (!clientId) {
    setStorageSync(KEY_CLIENT_ID, uuidv4()?.replaceAll('-', ''))
  }

  console.log('[client-id]', getStorageSync(KEY_CLIENT_ID))

  addEventHandler(EventName.Message, _pageKey, (data: any) => {
    switch (data.event) {
      case ControlEvent.LoadVideo:
        router.value.push(
          `/video/play/${data.vid}/${data.pid}?_source=${data.source}&t=${Math.random()}`,
        )
        break
    }
  })
  addEventHandler(EventName.Open, _pageKey, (data: any) => {
    // 加入房间
    joinGroup(clientId)
  })
  addEventHandler(EventName.Close, _pageKey, () => {
    setTimeout(connect, 3000)
  })
  connect()
}

const onBeforeUnmountHandler = () => {
  removeEventHandler(_pageKey)
}

export default defineComponent({
  components: {
    NSkeleton,
    NSpace,
    NSpin,
    NLoadingBarProvider,
    NNotificationProvider,
    NMessageProvider,
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())

    router.value = useRouter()

    onBeforeMount(onBeforeMountHandler)
    onBeforeUnmount(onBeforeUnmountHandler)

    return {
      sourceList,
    }
  },
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
