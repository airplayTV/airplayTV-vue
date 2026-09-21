<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div class="flex-1 flex-column" :key="tmpQuery">
      <AppHeader />
      <div v-if="video" style="padding: 0 10px" :key="video.id">
        <app-play-audio v-if="video.type === sourceTypeOption.mp3" :video="video" />
        <AdReviewWorkspace
            v-else-if="!isLiveVideo(video) && adReviewStore.enabled && video.type !== sourceTypeOption.mp3"
            :video="video"
            :source="getCurrentAppSource(appStore, route.query)" />
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
import {onBeforeMount, onBeforeUnmount, onUpdated, ref,} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {httpVideo} from '../helpers/api'
import {NResult, useLoadingBar, useMessage} from 'naive-ui'
import {useAppStore} from "@/stores/app.js";
import {DEFAULT_AUDIO_THUMB} from "@/helpers/constant.js";
import AppFooter from "@/components/AppFooter.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppPlayAudio from "@/components/AppPlayAudio.vue";
import AppPlayVideo from "@/components/AppPlayVideo.vue";
import {isLiveVideo, channelCover} from '@/helpers/iptv-presentation.js'
import {sourceTypeOption} from "@/helpers/play.js";
import {getCurrentAppSource} from "@/helpers/app.js";
import {useAdReviewStore} from '@/stores/ad-review.js'
import AdReviewWorkspace from '@/components/ad-review/AdReviewWorkspace.vue'

const route = useRoute()
const router = useRouter()
const loadingBar = useLoadingBar()
const message = useMessage()
const appStore = useAppStore()
const adReviewStore = useAdReviewStore()

const tmpQuery = ref('')
const video = ref(null)

let timer = null
let active = true

const onUpdatedHandler = async () => {
  const v = JSON.stringify({ p: route.params, q: route.query })
  if (v === tmpQuery.value) {
    // console.log('[无变化]')
    return
  }
  tmpQuery.value = v
  video.value = null
  if (timer) {
    clearInterval(timer)
  }
  await loadVideoAsync(route.params.id, v)
  if (active && tmpQuery.value === v) fixVideoWithLatestCache()
}

const loadVideoAsync = async (vid, requestKey) => {
  try {
    loadingBar.start()
    const resp = await httpVideo(vid, getCurrentAppSource(appStore, route.query))
    if (!active || tmpQuery.value !== requestKey) return
    video.value = resp.data;
    loadingBar.finish()
  } catch (e) {
    if (!active || tmpQuery.value !== requestKey) return
    loadingBar.error()
    console.log('[加载视频失败]', { e })
  }
}

const fixVideoWithLatestCache = () => {
  // console.log('[c]', JSON.parse(JSON.stringify(appStore.latestVideo)))
  // console.log('[v]', JSON.parse(JSON.stringify(video.value)))
  if (!video.value || !video.value.id) {
    return;
  }
  if (isLiveVideo(video.value)) {
    video.value.thumb = video.value.thumb || channelCover(video.value)
    return
  }
  if (!appStore.latestVideo || appStore.latestVideo.id !== video.value.id) {
    video.value.name = video.value.name || 'Untitled'
    video.value.thumb = video.value.thumb || DEFAULT_AUDIO_THUMB
    return
  }
  video.value = {
    ...video.value,
    ...{
      name: video.value.name || appStore.latestVideo.name || 'Untitled',
      thumb: video.value.thumb || appStore.latestVideo.thumb || DEFAULT_AUDIO_THUMB,
      actors: appStore.latestVideo.actors || video.value.actors,
    }
  }
}

onUpdated(onUpdatedHandler)
onBeforeMount(onUpdatedHandler)
onBeforeUnmount(() => { active = false; if (timer) clearInterval(timer) })

</script>

<style scoped>

</style>
