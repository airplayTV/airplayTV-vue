<template>
  <div>
    <n-grid x-gap="12" y-gap="1" :cols="cols">
      <n-gi v-for="(video, idx) in videoList" :key="idx" @click="onOpenVideo(video)">
        <div class="flex-row flex-justify-center flex-align-center">
          <n-image
            width="175"
            height="230"
            :src="video.thumb"
            :key="video.thumb"
            class="thumb"
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

    <div class="flex-row flex-justify-center">
      <n-pagination v-model:page="page" :page-count="pages" simple @update:page="onUpdatePage" />
    </div>

    <div class="padding-10px"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, ref } from 'vue'
import {
  NButton,
  NEllipsis,
  NGi,
  NGrid,
  NIcon,
  NImage,
  NInput,
  NInputGroup,
  NPagination,
  NSelect,
  useLoadingBar,
} from 'naive-ui'
import { httpVideoList } from '../helpers/api'
import { BrokenImageRound } from '@vicons/material'
import { getCurrentSource, getStorageSync } from '../helpers/utils'
import { KEY_VIDEO_SOURCE, KEY_VIDEO_TAG } from '../helpers/constant'
import { useRoute, useRouter } from 'vue-router'

const videoList = ref([])
const pages = ref(0)
const page = ref(0)
const loadingBar = ref(null)
const router = ref(null)
const route = ref(null)

const loadVideoList = (tag: string | number, _page: number) => {
  loadingBar.value?.start()
  httpVideoList(tag, _page, getCurrentSource(route.value))
    .then((resp) => {
      videoList.value = resp.data.list
      pages.value = resp.data.pages
      page.value = resp.data.page
    })
    .catch((err) => {
      console.log('[httpVideoList.Error]', err)
    })
    .finally(() => {
      loadingBar.value?.finish()
    })
}

const onBeforeMountHandler = () => {
  loadVideoList(getStorageSync(KEY_VIDEO_TAG), 1)
}

const onUpdatePage = (data: number) => {
  console.log('[onUpdatePage]', data)
  loadVideoList(getStorageSync(KEY_VIDEO_TAG), data)
}

const onOpenVideo = (video) => {
  const source = getStorageSync(KEY_VIDEO_SOURCE)
  router.value.push(`/video/detail/${video.id}?_source=${source}`)
}

export default defineComponent({
  components: {
    NSelect,
    NInputGroup,
    NInput,
    NButton,
    NIcon,
    NGrid,
    NGi,
    NImage,
    NEllipsis,
    NPagination,
    BrokenImageRound,
  },
  props: ['cols'],
  setup() {
    // const { sourceList } = storeToRefs(useAppStore())
    // const { getSourceList, setSourceList } = useAppStore()
    onBeforeMount(onBeforeMountHandler)
    loadingBar.value = useLoadingBar()
    router.value = useRouter()
    route.value = useRoute()
    return {
      videoList,
      pages,
      page,
      onUpdatePage,
      onOpenVideo,
    }
  },
})
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
