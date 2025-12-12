<template>
  <n-loading-bar-provider>
    <n-message-provider>
      <n-notification-provider>
        <div class="container">
          <div v-if="!sourceList" class="padding-20px">
            <n-skeleton text :repeat="2" />
            <n-skeleton text style="width: 60%" />

            <div v-if="errMsg">
              <div class="padding-30px"></div>
              <div class="padding-30px"></div>
              <n-result status="404" title="暂无数据" :description="errMsg"></n-result>
            </div>
            <div v-else class="flex-column flex-justify-center">
              <div class="padding-30px"></div>
              <div class="padding-30px"></div>
              <div class="padding-30px"></div>
              <n-spin size="large" />
            </div>

          </div>
          <RouterView v-else />
        </div>
      </n-notification-provider>
    </n-message-provider>
  </n-loading-bar-provider>
</template>

<script setup>
import {onBeforeMount, onBeforeUnmount, ref} from 'vue'
import {NLoadingBarProvider, NMessageProvider, NNotificationProvider, NResult, NSkeleton, NSpin,} from 'naive-ui'
// import { useAppStore } from '@/stores/app'
import {storeToRefs} from 'pinia'
import {useAppStore} from '@/stores/app'
import {v4 as uuidv4} from 'uuid'
import {arrayContainsValue, getStorageSync, setStorageSync} from '@/helpers/utils'
import {
  KEY_CLIENT_ID,
  KEY_VIDEO_LATEST_VIDEO,
  KEY_VIDEO_SOURCE,
  KEY_VIDEO_SOURCE_SECRET,
  KEY_VIDEO_STYLE_CONFIG,
  KEY_VIDEO_TAG
} from '@/helpers/constant'
import {
  addEventHandler,
  connect,
  ControlEventLoadVideo,
  EventNameClose,
  EventNameMessage,
  EventNameOpen,
  joinGroup,
  removeEventHandler,
} from '@/helpers/websocket'
import {useRoute, useRouter} from 'vue-router'
import {httpSourceList} from "@/helpers/api.js";

const _pageKey = '_key_app_page_app_'
const router = useRouter()
const route = useRoute()

const errMsg = ref('')
const { sourceList } = storeToRefs(useAppStore())

const onBeforeMountHandler = () => {
  const clientId = getStorageSync(KEY_CLIENT_ID)
  if (!clientId) {
    setStorageSync(KEY_CLIENT_ID, uuidv4()?.replaceAll('-', ''))
  }

  console.log('[client-id]', getStorageSync(KEY_CLIENT_ID))

  initAppStore()

  addEventHandler(EventNameMessage, _pageKey, (data) => {
    const appStore = useAppStore()
    switch (data.event) {
      case ControlEventLoadVideo:
        appStore.setSourceSecret(data.mode, false)
        router.push(
            `/video/play/${data.vid}/${data.pid}?_source=${data.source}&t=${Math.random()}`,
        )
        break
    }
  })
  addEventHandler(EventNameOpen, _pageKey, (data) => {
    // 加入房间
    joinGroup(clientId)
  })
  addEventHandler(EventNameClose, _pageKey, () => {
    setTimeout(connect, 3000)
  })
  connect()
}

const initAppStore = async () => {
  const appStore = useAppStore()

  appStore.setSourceSecret(getStorageSync(KEY_VIDEO_SOURCE_SECRET))
  appStore.setStyleConfig(getStorageSync(KEY_VIDEO_STYLE_CONFIG))
  appStore.setLatestVideo(getStorageSync(KEY_VIDEO_LATEST_VIDEO))
  if (!appStore.sourceList) {
    try {
      const resp = await httpSourceList()
      appStore.setSourceList(resp.data)
      appStore.setSourceSecret(getStorageSync(KEY_VIDEO_SOURCE_SECRET))
      appStore.setStyleConfig(getStorageSync(KEY_VIDEO_STYLE_CONFIG))

      checkOrResetSource(resp.data)

    } catch (e) {
      console.log('E]', e.message)
      // message.warning(e.message || '服务器异常')
      errMsg.value = e.message || '服务器异常'

    }
  }

}

const checkOrResetSource = (sourceList) => {
  const appStore = useAppStore()
  const tmpSource = getStorageSync(KEY_VIDEO_SOURCE)
  if (sourceList.length <= 0) {
    return// 无可用源
  }
  // console.log('[xxx]', tmpSource)
  const findSource = arrayContainsValue(sourceList, tmpSource, (item, v) => {
    return item.name === v
  })
  // console.log('[findSource]', findSource)
  if (!findSource) {
    appStore.setSource(sourceList[0].name)
    resetSourceTag(sourceList[0].tags)
  } else {
    appStore.setSource(tmpSource)
    const tmpTags = arrayContainsValue(sourceList, tmpSource, (item, v) => {
      if (item.name === v) {
        return item.tags
      }
      return null
    })
    resetSourceTag(tmpTags)
  }
}

const resetSourceTag = (currentSourceTags) => {
  const appStore = useAppStore()
  const tmpTag = getStorageSync(KEY_VIDEO_TAG)
  const findTag = arrayContainsValue(currentSourceTags, tmpTag, (item, v) => {
    return item.value === v
  })
  if (!findTag) {
    appStore.setTags(currentSourceTags[0]?.value)
  } else {
    appStore.setTags(tmpTag)
  }
}


const onBeforeUnmountHandler = () => {
  removeEventHandler(_pageKey)
}

onBeforeMount(onBeforeMountHandler)
onBeforeUnmount(onBeforeUnmountHandler)

</script>

<style scoped></style>
