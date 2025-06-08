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

<script>
import {defineComponent, onBeforeMount, ref} from 'vue'
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
  NResult,
  NSelect,
  useLoadingBar,
} from 'naive-ui'
import {httpVideoList} from '../helpers/api'
import {BrokenImageRound} from '@vicons/material'
import {getCurrentSource, getStorageSync} from '../helpers/utils'
import {KEY_VIDEO_SOURCE, KEY_VIDEO_TAG} from '../helpers/constant'
import {useRoute, useRouter} from 'vue-router'

const videoList = ref([])
const pages = ref(0)
const page = ref(0)
const loadingBar = ref(null)
const router = ref(null)
const route = ref(null)
const noVideoListMsg = ref(false)

const loadVideoList = (tag, _page) => {
  loadingBar.value?.start()
  videoList.value = []
  pages.value = 0
  page.value = 0
  noVideoListMsg.value = null

  httpVideoList(tag, _page, getCurrentSource(route.value))
      .then((resp) => {
        videoList.value = resp.data.list
        pages.value = resp.data.pages
        page.value = resp.data.page

        if (!resp.data.list || resp.data.list.length === 0) {
          noVideoListMsg.value = '暂无数据'
        }
      })
      .catch((err) => {
        console.log('[httpVideoList.Error]', err)
        noVideoListMsg.value = err
      })
      .finally(() => {
        loadingBar.value?.finish()
      })
}

const onBeforeMountHandler = () => {
  loadVideoList(getStorageSync(KEY_VIDEO_TAG), 1)
}

const onUpdatePage = (data) => {
  console.log('[onUpdatePage]', data)
  loadVideoList(getStorageSync(KEY_VIDEO_TAG), data)
}

const onOpenVideo = (video) => {
  const source = getStorageSync(KEY_VIDEO_SOURCE)
  router.value.push(`/video/detail/${video.id}?_source=${source}`)
}

export default defineComponent({
  components: {
    NResult,
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
      noVideoListMsg,
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
