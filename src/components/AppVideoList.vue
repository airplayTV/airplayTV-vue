<template>
  <div class="flex-1 flex-column flex-justify-between">
    <div v-if="noVideoListMsg">
      <div class="padding-30px"></div>
      <n-result status="404" title="暂无数据" :description="noVideoListMsg"></n-result>
    </div>
    <div v-else>
      <n-grid x-gap="12" y-gap="1" :cols="cols">
        <n-gi v-for="(video, idx) in videoList" :key="idx" @click="onOpenVideo(video)">
          <div class="flex-row flex-justify-center flex-align-center">
            <n-image
                width="175"
                height="230"
                :src="video.thumb"
                :key="video.thumb"
                class="thumb"
                object-fit="cover"
                preview-disabled
            />
          </div>

          <div class="name text-align-center">
            <n-ellipsis :line-clamp="1">
              {{ video.name }}
            </n-ellipsis>
          </div>
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
import {NEllipsis, NGi, NGrid, NImage, NPagination, NResult, useLoadingBar,} from 'naive-ui'
import {httpVideoList} from '../helpers/api'
import {getCurrentSource} from '../helpers/utils'
import {useRoute, useRouter} from 'vue-router'
import {useAppStore} from "@/stores/app.js";

const videoList = ref([])
const pages = ref(0)
const page = ref(1)
const loadingBar = useLoadingBar()
const router = useRouter()
const route = useRoute()
const noVideoListMsg = ref(false)
const appStore = useAppStore()

const loadVideoList = (tag, _page) => {
  loadingBar.start()
  videoList.value = []
  pages.value = 0
  page.value = 0
  noVideoListMsg.value = null

  httpVideoList(tag, _page, getCurrentSource(route)).then((resp) => {
    videoList.value = resp.data.list
    pages.value = resp.data.pages
    page.value = resp.data.page

    if (!resp.data.list || resp.data.list.length === 0) {
      noVideoListMsg.value = '暂无数据'
    }
  }).catch((err) => {
    console.log('[httpVideoList.Error]', err)
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

defineProps(['cols'])

onBeforeMount(onBeforeMountHandler)

</script>

<style scoped>
.thumb {
  border-radius: 4px;
  background-color: #f2f2f2;
}

.name {
  padding: 5px 0;
}
</style>
