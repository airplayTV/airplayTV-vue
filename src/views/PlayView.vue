<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />
      <div v-if="video" style="padding: 0 10px">
        <app-play-audio v-if="video.type === sourceTypeMp3" :video="video" />
        <app-play-video v-else :video="video" />
      </div>
      <div v-else style="padding: 0 10px">
        暂无音视频
      </div>
    </div>
    <AppFooter />

    <div v-if="video && video.type === sourceTypeMp3" style="width: 100%; height: 80px; "></div>

  </div>
</template>

<script setup>
import {onBeforeMount, onUpdated, ref,} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {httpVideo} from '../helpers/api'
import {useLoadingBar, useMessage} from 'naive-ui'
import {useAppStore} from "@/stores/app.js";
import {DEFAULT_AUDIO_THUMB} from "@/helpers/constant.js";
import AppFooter from "@/components/AppFooter.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppPlayAudio from "@/components/AppPlayAudio.vue";
import AppPlayVideo from "@/components/AppPlayVideo.vue";

const route = useRoute()
const router = useRouter()
const loadingBar = useLoadingBar()
const message = useMessage()
const appStore = useAppStore()

const tmpQuery = ref('')
const video = ref(null)
const sourceTypeMp3 = 'mp3'

let timer = null

const onUpdatedHandler = async () => {
  const v = JSON.stringify(route.params)
  if (v === tmpQuery.value) {
    // console.log('[无变化]')
    return
  }
  tmpQuery.value = v
  if (timer) {
    clearInterval(timer)
  }
  await loadVideoAsync(route.params.id)
}

const loadVideoAsync = async (vid) => {
  try {
    const resp = await httpVideo(vid, appStore.source)
    video.value = resp.data;
    video.value.name = video.value.name || 'Untitled'
    video.value.thumb = video.value.thumb || DEFAULT_AUDIO_THUMB
  } catch (e) {
    console.log('[加载视频失败]', { e })
  }
}

onUpdated(onUpdatedHandler)
onBeforeMount(onUpdatedHandler)

</script>

<style scoped>

</style>