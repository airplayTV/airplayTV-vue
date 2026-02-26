<template>
  <div class="flex-1 flex-column flex-justify-between">

    <div v-if="videoList===false" class="container flex-column flex-justify-center">
      <n-spin size="large" />
    </div>
    <div v-else-if="noVideoListMsg" class="xxx-4354 flex-1 flex-column flex-justify-center">
      <n-result status="404" title="暂无数据" :description="noVideoListMsg"></n-result>
    </div>
    <div v-else class="links">
      <n-grid x-gap="12" y-gap="1" :cols="cols">
        <n-gi v-for="(video, idx) in videoList" :key="idx">
          <RouterLink
              :target="getRouterLinkType(appStore.styleConfig)"
              @click="onClickVideo(video)"
              :to="`/video/detail/${video.id}?_source=${appStore.source}`" class="flex-column">
            <div class="flex-row flex-justify-center flex-align-center position-relative">
              <n-image
                  width="300"
                  :height="height"
                  :src="video.thumb"
                  :key="video.thumb"
                  @error="onLoadThumbError(video, idx)"
                  class="thumb overflow-hidden"
                  :object-fit="getImageObjectFit(appStore.styleConfig)"
                  preview-disabled
              />
              <div class="position-absolute vod-update-time" style="width: 100%;">
                <div class="c" v-if="video.updated_at">
                  更新：{{ FormatToDate(video.updated_at) }}
                </div>
              </div>
            </div>

            <div class="name text-align-center flex-justify-center">
              <n-ellipsis :line-clamp="1">
                {{ video.name }}
              </n-ellipsis>
            </div>
          </RouterLink>

        </n-gi>
      </n-grid>
    </div>

    <div class="flex-row flex-justify-center">
      <n-pagination v-model:page="page" :page-count="pages" simple @update:page="onUpdatePage" />
    </div>
  </div>
</template>

<script setup>
import {onBeforeMount, ref} from 'vue'
import {NEllipsis, NGi, NGrid, NImage, NPagination, NResult, NSpin, useLoadingBar,} from 'naive-ui'
import {httpVideoList} from '../helpers/api'
import {useRoute, useRouter} from 'vue-router'
import {useAppStore} from "@/stores/app.js";
import {FormatToDate} from "../helpers/time.js";
import {getImageObjectFit, getRouterLinkType} from "../helpers/app.js";
import {apiUrl} from "@/config.js";

const videoList = ref(false)
const pages = ref(0)
const page = ref(1)
const loadingBar = useLoadingBar()
const router = useRouter()
const route = useRoute()
const noVideoListMsg = ref(false)
const appStore = useAppStore()

const loadVideoList = (tag, _page) => {
  loadingBar.start()
  videoList.value = false
  pages.value = 0
  page.value = 0
  noVideoListMsg.value = null

  httpVideoList(tag, _page, appStore.source).then((resp) => {
    videoList.value = resp.data.list
    pages.value = resp.data.pages
    page.value = resp.data.page

    if (!resp.data.list || resp.data.list.length === 0) {
      videoList.value = []
      noVideoListMsg.value = '暂无数据'
    }
  }).catch((err) => {
    console.log('[httpVideoList.Error]', err)
    videoList.value = []
    noVideoListMsg.value = err
  }).finally(() => {
    loadingBar.finish()
  })
}

const onBeforeMountHandler = () => {
  const q = route.query
  if (q.hasOwnProperty('page')) {
    page.value = +q.page
  }
  if (q.hasOwnProperty('_source')) {
    appStore.setSource(q._source)
  }
  if (q.hasOwnProperty('tag')) {
    appStore.setTags(q.tag)
  }

  loadVideoList(appStore.tags, page.value)
}

const onUpdatePage = (data) => {
  router.push(`/?page=${data}&tag=${appStore.tags}&_source=${appStore.source}`)
}

const onOpenVideo = (video) => {
  router.push(`/video/detail/${video.id}?_source=${appStore.source}`)
}

const onClickVideo = (video) => {
  // console.log('[onClickVideo]', video)
  appStore.setLatestVideo(video)
}

const onLoadThumbError = (video, idx) => {
  const tmpVideo = videoList.value[idx] || null
  if (tmpVideo && !tmpVideo.thumbp) {
    videoList.value[idx] = Object.assign({}, tmpVideo, {
      thumbp: true,
      thumb: `${apiUrl}/api/thumbp?url=${btoa(tmpVideo.thumb)}&t=${Math.random()}`
    })
  }
}

defineProps(['cols', 'width', 'height'])

onBeforeMount(onBeforeMountHandler)

</script>

<style scoped>

.container {
  min-height: 360px;
}

.thumb {
  border-radius: 4px;
  background-color: #f2f2f2;
}

.name {
  padding: 5px 0;
  display: flex;
}

.vod-update-time {
  width: 175px;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.47);
  border-radius: 4px;
  font-size: 12px;
  color: #ffffff;

  .c {
    padding: 4px 6px;
  }
}
</style>
