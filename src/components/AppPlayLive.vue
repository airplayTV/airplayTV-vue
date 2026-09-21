<template>
  <div class="iptv-player">
    <AppArtplayer v-if="option" :key="generation" :option="option" class="iptv-surface" @get-instance="onPlayer" />
    <div v-if="loading || error" class="iptv-status flex-column flex-justify-center flex-align-center">
      <n-spin v-if="loading" size="large" />
      <template v-else>
        <n-text depth="3">{{ error }}</n-text>
        <n-button text @click="start">重试</n-button>
      </template>
    </div>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref, shallowRef} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {NButton, NSpin, NText} from 'naive-ui'
import Hls from 'hls.js'
import AppArtplayer from '@/components/AppArtplayer.vue'
import {httpVideoSource} from '@/helpers/api.js'
import {createLiveDelivery} from '@/helpers/iptv-delivery.js'
import {startLivePlayback} from '@/helpers/iptv-playback.js'
import {getStorageSync} from '@/helpers/utils.js'
import {KEY_CLIENT_ID, KEY_ROOM_ID} from '@/helpers/constant.js'
import {useAppStore} from '@/stores/app.js'

const props = defineProps({video: {type: Object, required: true}})
const emit = defineEmits(['source-loaded', 'change-channel'])
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const room = getStorageSync(KEY_ROOM_ID)
const clientId = getStorageSync(KEY_CLIENT_ID)
const casting = Boolean(room && room !== clientId)
const loading = ref(false)
const error = ref('')
const option = shallowRef(null)
const player = shallowRef(null)
const generation = ref(0)
let active = true
let delivery = null
let deliveryTimer = null
const start = async () => {
  if (loading.value) return
  delivery?.destroy()
  clearInterval(deliveryTimer)
  const current = ++generation.value
  loading.value = true
  error.value = ''
  option.value = null
  player.value = null
  try {
    const source = await startLivePlayback({
      video: props.video, pid: route.query.pid, room, clientId, mode: appStore.sourceSecret,
      loadSource: httpVideoSource,
      navigate: path => router.push(path),
      isCurrent: () => active && generation.value === current,
    })
    if (!active || generation.value !== current || !source) return
    emit('source-loaded', source)
    let installed = false
    option.value = {
      url: source.url, type: 'm3u8', isLive: true, autoplay: true,
      playsInline: true, fullscreen: true, fullscreenWeb: true, volume: 0.7,
      controls: [
        {name: 'previous-channel', position: 'left', html: '上一台', click: () => emit('change-channel', -1)},
        {name: 'next-channel', position: 'left', html: '下一台', click: () => emit('change-channel', 1)},
        {name: 'live-edge', position: 'right', html: '直播', tooltip: '回到直播', click: () => backToLive()},
      ],
      customType: {m3u8: (video, url, art) => {
        if (!active || generation.value !== current) return
        // Artplayer retries customType after video:error. Delivery owns retries;
        // never create a second engine or reset proxy mode on that callback.
        if (installed) { art.loading.show = video.readyState < 2; return }
        installed = true
        const controller = createLiveDelivery({
          Hls, video, url, proxyUrl: source.proxyUrl,
          onMode: (mode, target) => {
            if (!active || generation.value !== current) return
            video.dataset.iptvDelivery = mode
            emit('source-loaded', {...source, url: target})
          },
          onError: () => {
            if (active && generation.value === current) error.value = '直播播放失败，请重试或切换频道'
          },
        })
        delivery = controller
        const timer = setInterval(() => controller.tick(), 2000)
        deliveryTimer = timer
        art.on('destroy', () => {
          controller.destroy()
          clearInterval(timer)
          if (delivery === controller) delivery = null
        })
      }},
    }
  } catch (_) {
    if (active && generation.value === current) {
      error.value = casting ? '投屏失败，请检查电视连接后重试' : '直播源加载失败，请稍后重试'
    }
  } finally {
    if (active && generation.value === current) loading.value = false
  }
}
const onPlayer = instance => {
  player.value = instance
  instance.on('video:error', () => { if (active && delivery) { delivery.mediaError(); return } if (active) error.value = '直播播放失败，请重试或切换频道' })
}
const backToLive = () => {
  const video = player.value?.video
  if (!video) return
  const position = delivery?.liveSyncPosition
  if (Number.isFinite(position)) video.currentTime = position
  else if (video.seekable.length) video.currentTime = Math.max(video.seekable.start(video.seekable.length - 1), video.seekable.end(video.seekable.length - 1) - 3)
  video.play().catch(() => { if (active) error.value = '请点击播放器播放按钮继续' })
}
const onKeydown = event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || event.defaultPrevented) return
  const target = event.target
  if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '')) return
  if (event.key.toLowerCase() === 'p') emit('change-channel', -1)
  else if (event.key.toLowerCase() === 'n') emit('change-channel', 1)
  else if (event.key.toLowerCase() === 'f' && player.value) player.value.fullscreen = !player.value.fullscreen
}
onMounted(() => { window.addEventListener('keydown', onKeydown); void start() })
onBeforeUnmount(() => { active = false; generation.value++; delivery?.destroy(); delivery = null; clearInterval(deliveryTimer); window.removeEventListener('keydown', onKeydown) })
</script>

<style scoped>
.iptv-player { position: relative; width: 100%; overflow: hidden; border-radius: 4px; }
.iptv-surface { width: 100%; height: 100%; }
.iptv-status { position: absolute; inset: 0; gap: 8px; background: #f2f2f2; }
</style>
