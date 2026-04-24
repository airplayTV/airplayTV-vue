<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div class="flex-1 flex-column" :key="tmpQuery">
      <AppHeader />
      <div v-if="video" style="padding: 0 10px" :key="video.id">
        <app-play-audio v-if="video.type === sourceTypeOption.mp3" :video="video" />
        <app-play-video v-else :video="video" />
      </div>
      <div v-else class="flex-column flex-1 flex-justify-center flex-align-center">
        <n-result status="404" title="暂无数据" description=""></n-result>

      </div>
    </div>
    <AppFooter />

    <div v-if="video && video.type === sourceTypeOption.mp3" style="width: 100%; height: 80px; "></div>

  </div>
</template>

<script setup>
import {onBeforeMount, onUpdated, ref,} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {httpVideo} from '../helpers/api'
import {NResult, useLoadingBar, useMessage} from 'naive-ui'
import {useAppStore} from "@/stores/app.js";
import {DEFAULT_AUDIO_THUMB} from "@/helpers/constant.js";
import AppFooter from "@/components/AppFooter.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppPlayAudio from "@/components/AppPlayAudio.vue";
import AppPlayVideo from "@/components/AppPlayVideo.vue";
import {sourceTypeOption} from "@/helpers/play.js";
import {getCurrentAppSource} from "@/helpers/app.js";

const route = useRoute()
const router = useRouter()
const loadingBar = useLoadingBar()
const message = useMessage()
const appStore = useAppStore()

const tmpQuery = ref('')
const video = ref(null)

let timer = null

const onUpdatedHandler = async () => {
  const v = JSON.stringify({ p: route.params, q: route.query })
  if (v === tmpQuery.value) {
    // console.log('[无变化]')
    return
  }
  tmpQuery.value = v
  if (timer) {
    clearInterval(timer)
  }
  await loadVideoAsync(route.params.id)
  fixVideoWithLatestCache()
}

const loadVideoAsync = async (vid) => {
  try {
    loadingBar.start()
    const resp = await httpVideo(vid, getCurrentAppSource(appStore, route.query))
    video.value = resp.data;
    video.value.name = video.value.name || 'Untitled'
    video.value.thumb = video.value.thumb || DEFAULT_AUDIO_THUMB
    loadingBar.finish()
  } catch (e) {
    loadingBar.error()
    console.log('[加载视频失败]', { e })
  }
}

const fixVideoWithLatestCache = () => {
  // console.log('[c]', JSON.parse(JSON.stringify(appStore.latestVideo)))
  // console.log('[v]', JSON.parse(JSON.stringify(video.value)))
  if (!appStore.latestVideo || appStore.latestVideo.id !== video.value.id) {
    return
  }
  video.value = {
    ...video.value,
    ...{
      name: appStore.latestVideo.name || video.value.name,
      thumb: appStore.latestVideo.thumb || video.value.thumb,
      actors: appStore.latestVideo.actors || video.value.actors,
    }
  }
}

onUpdated(onUpdatedHandler)
onBeforeMount(onUpdatedHandler)

</script>

<style scoped>

</style>