<template>
  <div v-if="video === false" class="flex-column flex-justify-center">
    <div class="padding-30px"></div>
    <div class="padding-30px"></div>
    <div class="padding-30px"></div>
    <n-spin size="large" />
  </div>
  <div v-else-if="video" class="flex-column">
    <div class="flex-column flex-align-center" v-if="appStore.styleConfig===1">
      <div class="padding-10px"></div>
      <n-image
          :width="width*cols*0.8"
          :height="height*cols*0.8"
          object-fit="cover"
          :src="video.thumb"
          :key="video.thumb"
          class="thumb"
      />
      <div class="padding-10px"></div>
    </div>
    <div class="flex-column flex-align-center" v-else>
      <n-image
          width="200"
          height="280"
          object-fit="cover"
          :src="video.thumb"
          :key="video.thumb"
          class="thumb"
      />
    </div>

    <div class="flex-row flex-align-center">
      <n-h2>{{ video.name }}</n-h2>
      <div class="padding-2px"></div>
      <RouterLink :to="`/video/search?page=1&keyword=${video.name}`" target="_blank">
        <n-icon color="#5e5b5b" size="20">
          <SearchSharp />
        </n-icon>
      </RouterLink>

    </div>

    <n-ellipsis :line-clamp="6">
      <b>
        <n-text depth="2">简介：</n-text>
      </b>
      <n-text depth="3">
        {{ video.intro ? video.intro : '暂无' }}
      </n-text>
    </n-ellipsis>

    <div style="padding: 5px"></div>
    <div>
      <b>
        <n-text depth="2">更新：</n-text>
      </b>
      <n-text depth="3">{{ video.updated_at }}</n-text>
    </div>

    <AppSourceList :source-list="videoSourceList" :vid="video.id" />
  </div>
  <div v-else>
    <div class="padding-30px"></div>
    <div class="padding-30px"></div>
    <div class="padding-30px"></div>
    <n-result status="404" title="暂无数据" :description="errMsg"></n-result>
  </div>

</template>

<script setup>
import {computed, onBeforeMount, onBeforeUpdate, onMounted, onUpdated, ref} from 'vue'
import {NEllipsis, NH2, NIcon, NImage, NResult, NSpin, NText, useLoadingBar,} from 'naive-ui'
import {SearchSharp} from '@vicons/material'
import {useRoute} from 'vue-router'
import {httpVideo} from '@/helpers/api'
import AppSourceList from '@/components/AppSourceList.vue'
import {formatVideoSourceMap} from '@/helpers/app'
import {useAppStore} from "@/stores/app.js";
import {computeWindowWidthColumn} from "@/helpers/utils.js";


const video = ref(false)
// const pages = ref(0)
// const page = ref(0)
const _key = ref(null)

const loadingBar = useLoadingBar()
const route = useRoute()
const appStore = useAppStore()

const cols = ref(1)
const width = ref(0)
const height = ref(0)
const errMsg = ref('')

const loadVideo = (id) => {
  video.value = false
  loadingBar.start()
  httpVideo(id, appStore.source).then((resp) => {
    video.value = resp.data
  }).catch((err) => {
    errMsg.value = err
    video.value = null
    console.log('[httpVideo.Error]', err)
  }).finally(() => {
    loadingBar.finish()
  })
}

const onBeforeMountHandler = () => {
  // loadVideo(route.params.id)
  doRequest()
}

const videoSourceList = computed(() => {
  return formatVideoSourceMap(video.value.links)
})

const onBeforeUpdateHandler = () => {
  doRequest()
}
const onUpdatedHandler = () => {
}

const doRequest = () => {
  const _k = `${route.params.id},${route.query._source}`
  if (_k !== _key.value) {
    _key.value = _k
    loadVideo(route.params.id)
  }
}


onMounted(() => {
  window.onresize = () => {
    const { _column, _windowWidth, _width, _height } = computeWindowWidthColumn()
    cols.value = _column
    width.value = _width
    height.value = _height
  }
  const { _column, _windowWidth, _width, _height } = computeWindowWidthColumn()
  cols.value = _column
  width.value = _width
  height.value = _height
})

onBeforeMount(onBeforeMountHandler)

onBeforeUpdate(onBeforeUpdateHandler)
onUpdated(onUpdatedHandler)

</script>

<style scoped>
.thumb {
  border-radius: 4px;
}

.name {
  padding: 5px 0;
}

.n-h2 {
  margin: 12px 0 4px 0 !important;
}
</style>
