<template>
  <div class="iptv-player">
    <div v-if="playType === playTypeOption.dp" ref="dpRef" class="iptv-surface" />
    <AppArtplayer v-else-if="playType === playTypeOption.art && option" :key="generation" :option="option" class="iptv-surface" @get-instance="onPlayer" />
    <LibmediaPlayer
      v-else-if="playType === playTypeOption.libmedia && libmediaSession"
      :key="libmediaSession.key" ref="libmediaRef" :src="libmediaSession.url"
      :autoplay="true" :engine-options="liveEngineOptions" class="iptv-surface"
      @error="libmediaSession.onError" @pause="libmediaSession.onPause"
      @play="libmediaSession.onPlay" @timeupdate="libmediaSession.onTimeupdate"
      @diagnostic="libmediaSession.onDiagnostic"
    />
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
import {computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {NButton, NSpin, NText} from 'naive-ui'
import Hls from 'hls.js'
import DPlayer from 'dplayer'
import {LibmediaPlayer} from 'libmedia-avp-vue3'
import 'libmedia-avp-vue3/style.css'
import AppArtplayer from '@/components/AppArtplayer.vue'
import {httpVideoSource} from '@/helpers/api.js'
import {createLiveDelivery, createLibmediaLiveDelivery} from '@/helpers/iptv-delivery.js'
import {playTypeOption, resolvePlayerPreference} from '@/helpers/player-preference.js'
import {startLivePlayback} from '@/helpers/iptv-playback.js'
import {liveLineSelector} from '@/helpers/iptv-presentation.js'
import {getStorageSync} from '@/helpers/utils.js'
import {KEY_CLIENT_ID, KEY_ROOM_ID} from '@/helpers/constant.js'
import {useAppStore} from '@/stores/app.js'
import {v4 as uuidv4} from 'uuid'
import {addEventHandler, removeEventHandler, EventNameMessage, ControlEventPlay, ControlEventPause} from '@/helpers/websocket.js'

const props = defineProps({video: {type: Object, required: true}, playerType: {type: Number, default: 1}})
const playType = computed(() => resolvePlayerPreference(props.playerType))
const liveEngineOptions = {isLive: true}
const emit = defineEmits(['source-loaded', 'change-channel'])
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const room = getStorageSync(KEY_ROOM_ID)
const clientId = getStorageSync(KEY_CLIENT_ID)
const casting = Boolean(room && room !== clientId)
const controlKey = uuidv4()
const loading = ref(false)
const error = ref('')
const option = shallowRef(null)
const player = shallowRef(null)
const dpRef = ref(null)
const libmediaRef = ref(null)
const libmediaSession = shallowRef(null)
let libmediaGeneration = 0
const generation = ref(0)
let active = true
let delivery = null
let deliveryTimer = null
const changeLine = pid => { if (active) router.push({path: route.path, query: {...route.query, pid}}) }
const stop = () => {
  delivery?.destroy()
  delivery = null
  clearInterval(deliveryTimer)
  if (playType.value === playTypeOption.dp) player.value?.destroy()
  player.value = null
  option.value = null
  libmediaSession.value = null
}
const start = async () => {
  if (loading.value) return
  const current = ++generation.value
  stop()
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
    const isCurrent = () => active && generation.value === current
    const onError = () => {
      if (!isCurrent()) return
      error.value = '直播播放失败，请重试或切换频道'
      // Unmount a failed decoder so it cannot keep downloading behind the error UI.
      libmediaSession.value = null
    }
    const onMode = (mode, target) => {
      if (isCurrent()) emit('source-loaded', {...source, url: target})
    }
    if (playType.value === playTypeOption.libmedia) {
      delivery = createLibmediaLiveDelivery({
        url: source.url, proxyUrl: source.proxyUrl, initialMode: source.delivery_mode,
        onMode, onError,
        load: session => {
          if (isCurrent()) libmediaSession.value = {...session, key: ++libmediaGeneration}
        },
      })
      deliveryTimer = setInterval(() => delivery?.tick(), 2000)
      return
    }
    let installed = false
    const installDelivery = (video, url) => {
      if (!isCurrent() || installed) return
      installed = true
      delivery = createLiveDelivery({Hls, video, url, proxyUrl: source.proxyUrl,
        initialMode: source.delivery_mode, onError,
        onMode: (mode, target) => { video.dataset.iptvDelivery = mode; onMode(mode, target) },
      })
      const controller = delivery
      deliveryTimer = setInterval(() => controller.tick(), 2000)
    }
    if (playType.value === playTypeOption.dp) {
      await nextTick()
      if (!isCurrent()) return
      const instance = new DPlayer({
        container: dpRef.value, live: true, autoplay: true, hotkey: false,
        video: {url: source.url, type: 'iptv', customType: {iptv: video => installDelivery(video, source.url)}},
      })
      player.value = instance
      instance.on('error', () => { if (isCurrent()) delivery?.mediaError() })
      return
    }
    option.value = {
      url: source.url, type: 'm3u8', isLive: true, autoplay: true,
      playsInline: true, fullscreen: true, fullscreenWeb: true, volume: 0.7,
      controls: [
        ...(props.video.links?.length > 1 ? [{
          name: 'live-line', position: 'right', html: '线路',
          selector: liveLineSelector(props.video.links, route.query.pid),
          onSelect: item => changeLine(item.id),
        }] : []),
        {name: 'previous-channel', position: 'left', html: '上一台', click: () => emit('change-channel', -1)},
        {name: 'next-channel', position: 'left', html: '下一台', click: () => emit('change-channel', 1)},
        {name: 'live-edge', position: 'right', html: '直播', tooltip: '回到直播', click: () => backToLive()},
      ],
      customType: {m3u8: (video, url, art) => {
        if (!active || generation.value !== current) return
        // Artplayer retries customType after video:error. Delivery owns retries;
        // never create a second engine or reset proxy mode on that callback.
        if (installed) { art.loading.show = video.readyState < 2; return }
        installDelivery(video, url)
        const controller = delivery
        const timer = deliveryTimer
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
  if (!active) return
  player.value = instance
  instance.on('video:error', () => { if (active && player.value === instance) delivery?.mediaError() })
}
const backToLive = () => {
  if (playType.value === playTypeOption.libmedia) { delivery?.restart(); return }
  const video = player.value?.video
  if (!video) return
  const position = delivery?.liveSyncPosition
  if (Number.isFinite(position)) video.currentTime = position
  else if (video.seekable.length) video.currentTime = Math.max(video.seekable.start(video.seekable.length - 1), video.seekable.end(video.seekable.length - 1) - 3)
  video.play().catch(() => { if (active) error.value = '请点击播放器播放按钮继续' })
}
const onControl = async data => {
  if (!active || casting) return
  try {
    if (data.event === ControlEventPause) {
      if (playType.value === playTypeOption.libmedia) await libmediaRef.value?.pause()
      else player.value?.pause()
    } else if (data.event === ControlEventPlay) {
      if (playType.value === playTypeOption.libmedia) await libmediaRef.value?.play()
      else backToLive()
    }
  } catch (_) {
    if (active) error.value = '播放控制失败，请重试'
  }
}
const onKeydown = event => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || event.defaultPrevented) return
  const target = event.target
  if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '')) return
  if (event.key.toLowerCase() === 'p') emit('change-channel', -1)
  else if (event.key.toLowerCase() === 'n') emit('change-channel', 1)
  else if (event.key.toLowerCase() === 'f') {
    if (playType.value === playTypeOption.dp) player.value?.fullScreen.toggle()
    else if (playType.value === playTypeOption.libmedia) libmediaRef.value?.enterFullscreen()?.catch(() => {})
    else if (player.value) player.value.fullscreen = !player.value.fullscreen
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (!casting) addEventHandler(EventNameMessage, controlKey, onControl)
  void start()
})
onBeforeUnmount(() => {
  active = false
  generation.value++
  removeEventHandler(controlKey)
  stop()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.iptv-player { position: relative; display: flex; flex-direction: column; width: 100%; overflow: hidden; border-radius: 4px; }
.iptv-surface { width: 100%; flex: 1; min-height: 0; }
.iptv-status { position: absolute; inset: 0; gap: 8px; background: #f2f2f2; }
</style>
