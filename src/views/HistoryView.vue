<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 0 10px">
        <n-grid x-gap="12" y-gap="1" :cols="cols">
          <n-gi v-for="(video, idx) in historyList" :key="idx" @click="onOpenVideo(video)">
            <div class="flex-row flex-justify-center flex-align-center thumb-warp">
              <div class="update-time">
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
              <div>
                <n-ellipsis :line-clamp="1">
                  {{ video.name }}
                </n-ellipsis>
              </div>
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
  </div>
</template>

<script >
import AppHeader from '../components/AppHeader.vue'
import AppSearchList from '@/components/AppSearchList.vue'
import AppFooter from '@/components/AppFooter.vue'
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import { computeWindowWidthColumn } from '@/helpers/utils'
import { listHistory } from '@/helpers/db'
import { NEllipsis, NGi, NGrid, NImage, NProgress, NResult, NText } from 'naive-ui'
import { useRouter } from 'vue-router'
import { format } from 'fecha'

const router = ref(null)
const windowWidth = ref(0)
const cols = ref(2)
const historyList = ref(null)

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

const onBeforeMountHandler = async () => {
  const findList = await listHistory()
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
  // historyList.value
  console.log('[historyList]', historyList.value)
}

const onOpenVideo = (video) => {
  console.log('[]', router)
  console.log('[]', video)
  // router.value.push(`/video/detail/${video.vid}?_source=${video._source}`)
  router.value.push(`/video/play/${video.vid}/${video.pid}?_source=${video.source}`)
}

export default defineComponent({
  components: {
    NResult,
    NGrid,
    NEllipsis,
    NImage,
    NGi,
    AppHeader,
    AppSearchList,
    AppFooter,
    NProgress,
    NText,
  },
  setup() {
    onMounted(onMountedHandler)
    onBeforeMount(onBeforeMountHandler)

    router.value = useRouter()

    return {
      cols,
      historyList,
      onOpenVideo,
    }
  },
})
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

  .update-time {
    width: 175px; /** width+padding总宽等于图片设置的宽度 **/
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    position: absolute;
    z-index: 9;
    bottom: 0;
    //background-color: rgba(44, 62, 80, 0.76);
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
