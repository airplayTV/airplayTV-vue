<template>
  <div class="flex-1 flex-column flex-justify-between">

    <div v-if="videoList===false" class="container flex-column flex-justify-center">
      <n-spin size="large" />
    </div>
    <div v-else-if="noVideoListMsg" class="xxx-4354 flex-1 flex-column flex-justify-center">
      <n-result status="404" title="暂无数据" :description="noVideoListMsg"></n-result>
    </div>
    <AppVideoGrid v-else :video-list="videoList" :cols="cols" :height="height"
                  :source="appStore.source" @image-error="onLoadThumbError" />

    <div class="flex-row flex-justify-center">
      <n-pagination v-model:page="page" :page-count="pages" simple @update:page="onUpdatePage" />
    </div>
  </div>
</template>

<script setup>
import {onBeforeMount, ref} from 'vue'
import AppVideoGrid from '@/components/AppVideoGrid.vue'
import {NPagination, NResult, NSpin, useLoadingBar,} from 'naive-ui'
import {httpVideoList} from '../helpers/api'
import {useRoute, useRouter} from 'vue-router'
import {useAppStore} from "@/stores/app.js";
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
.container { min-height: 360px; }
</style>
