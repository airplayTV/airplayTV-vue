<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 0 10px">
        <n-grid x-gap="12" y-gap="1" :cols="cols" class="links">
          <n-gi v-for="(video, idx) in historyList" :key="idx">
            <div class="flex-row flex-justify-center flex-align-center thumb-warp position-relative">
              <div class="close flex-row flex-justify-between width-100">
                <div></div>
                <div class="close-box flex-column flex-justify-center flex-align-center">
                  <n-icon color="#ffffff" size="22" @click="onOpenClearHistoryTips(video)">
                    <CloseRound />
                  </n-icon>
                </div>
              </div>
              <div class="update-time width-100">
                <div class="time">
                  <div>{{ video.source }}</div>
                  <div>{{ video.updated_time }}</div>
                </div>
                <div
                    class="progress"
                    style="width: 50%"
                    :style="{ width: `${video.percent}%` }"
                ></div>
              </div>
              <n-image
                  @click="onOpenVideo(video)"
                  width="300"
                  height="230"
                  :src="video.thumb"
                  :key="video.thumb"
                  class="thumb overflow-hidden"
                  object-fit="cover"
                  preview-disabled
              />
            </div>

            <div class="name text-align-center">
              <n-ellipsis :line-clamp="1">
                <router-link class="flex-column" :to="`/video/detail/${video.id}?_source=${appStore.source}`">
                  {{ video.name }}
                </router-link>
              </n-ellipsis>
            </div>
          </n-gi>
        </n-grid>

        <div v-if="!historyList || historyList.length === 0">
          <div class="padding-30px"></div>
          <n-result status="404" title="暂无数据" description=""></n-result>
          <div class="padding-30px"></div>
        </div>
      </div>
    </div>

    <AppFooter />

    <n-modal
        v-model:show="showClearHistoryModal"
        preset="dialog"
        title="提示"
        content="确定删除该播放记录？"
        positive-text="确认"
        negative-text="关闭"
        @positive-click="removeHistory"
    />

  </div>
</template>

<script setup>
import {onBeforeMount, onMounted, ref} from 'vue'
import {computeWindowWidthColumn} from '@/helpers/utils'
import {deleteVideoHistory, listHistory} from '@/helpers/db'
import {NEllipsis, NGi, NGrid, NIcon, NImage, NModal, NResult} from 'naive-ui'
import {useRouter} from 'vue-router'
import {format} from 'fecha'
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import {CloseRound} from '@vicons/material'
import {useAppStore} from "@/stores/app.js";

const router = useRouter()
const appStore = useAppStore()

const windowWidth = ref(0)
const cols = ref(2)
const historyList = ref(null)
const showClearHistoryModal = ref(false)
const selectedHistory = ref(null)

const onMountedHandler = () => {
  window.onresize = () => {
    const { _column, _windowWidth } = computeWindowWidthColumn()
    windowWidth.value = _windowWidth
    cols.value = _column
  }
  const { _column, _windowWidth } = computeWindowWidthColumn()
  windowWidth.value = _windowWidth
  cols.value = _column
}

const onBeforeMountHandler = () => {
  loadHistoryList()
}

const loadHistoryList = async (page) => {
  const findList = await listHistory(page, 50)
  historyList.value = findList.map((item) => {
    // item.updated_time = (new Date(item.updated_at)).toLocaleString()
    item.updated_time = format(new Date(item.updated_at), 'YYYY/MM/DD hh:mm:ss')

    item.percent = 0
    if (item.lastTime && item.duration) {
      item.percent = (item.lastTime / item.duration) * 100
    }
    if (item.percent > 100) {
      item.percent = 100
    }

    return item
  })
  console.log('[historyList]', historyList.value)
}

const onOpenVideo = (video) => {
  console.log('[]', router)
  console.log('[]', video)
  // router.value.push(`/video/detail/${video.vid}?_source=${video._source}`)
  router.push(`/video/play/${video.vid}/${video.pid}?_source=${video.source}`)
}

const removeHistory = async () => {
  if (selectedHistory.value) {
    console.log('[removeHistory]', selectedHistory.value)
    await deleteVideoHistory(selectedHistory.value.source, selectedHistory.value.vid, selectedHistory.value.pid)
    await loadHistoryList()
  }
}

const onOpenClearHistoryTips = (video) => {
  selectedHistory.value = video
  showClearHistoryModal.value = true
}

onMounted(onMountedHandler)
onBeforeMount(onBeforeMountHandler)

</script>

<style scoped lang="scss">
.thumb {
  border-radius: 4px;
  background-color: #f2f2f2;
}

.name {
  padding: 5px 0;
}

.thumb-warp {
  position: relative;

  .close {
    position: absolute;
    z-index: 9;
    top: 0;
  }

  .close-box {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.47);
    cursor: pointer;
  }

  .update-time {
    border-radius: 4px;
    position: absolute;
    z-index: 9;
    bottom: 0;
    background-color: rgb(0, 0, 0, 0.47);
    color: #ffffff;
    text-align: left;

    .time {
      display: flex;
      flex-direction: column;
      padding: 5px 5px 0 5px;
      color: #ffffff;
    }

    .progress {
      width: 0;
      height: 4px;
      background-color: #18a058;
      border-radius: 4px;
    }
  }
}
</style>
