<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 0 10px" v-if="video">
        <n-h2 class="text-align-center">{{ video.name }}</n-h2>

        <!--<video :src="video.url" style="width: 100%" />-->
        <div style="border-radius: 4px; display: flex; min-height: 180px">
          <AppArtplayer
            :key="artOption"
            :option="artOption"
            :style="artStyle"
            @get-instance="getArtInstance"
          />
        </div>

        <div style="color: dimgray; word-wrap: break-word" v-if="source">
          <div style="padding: 8px 0">
            <n-text depth="2">{{ source.url }}</n-text>
          </div>

          <n-ellipsis :line-clamp="5">
            <b>
              <n-text depth="2">简介：</n-text>
            </b>
            <n-text depth="3">
              {{ video.intro }}
            </n-text>
          </n-ellipsis>
        </div>

        <n-collapse accordion default-expanded-names="1">
          <n-collapse-item title="选集" name="1">
            <AppSourceList v-if="video" :vid="vid" :pid="pid" :source-list="videoSourceList" />
          </n-collapse-item>
        </n-collapse>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  ref,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { httpPlayUrlNetworkCheck, httpVideo, httpVideoSource } from '../helpers/api'
import {
  NCollapse,
  NCollapseItem,
  NEllipsis,
  NH2,
  NText,
  useLoadingBar,
  useMessage,
  useNotification,
} from 'naive-ui'
import AppSourceList from '@/components/AppSourceList.vue'
import AppArtplayer from '@/components/AppArtplayer.vue'
import { formatVideoSourceMap } from '@/helpers/app.ts'
import Hls from 'hls.js'
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control'
import AppFooter from '@/components/AppFooter.vue'
import { addHistory, findHistory, updateHistory } from '@/helpers/db.ts'
import { getCurrentSource } from '@/helpers/utils.ts'
import {
  addEventHandler,
  ControlEvent,
  EventName,
  removeEventHandler,
} from '@/helpers/websocket.ts'
import axios from 'axios'
import { apiUrl } from '@/config.ts'

const timer = ref(null)
const updateCount = ref(0)
const route = ref(null)
const vid = ref(null)
const pid = ref(null)
const loadingBar = ref(null)
const tmpQuery = ref(null)
const notification = ref(null)
const message = ref(null)

const source = ref(null)
const video = ref(null)
const artRef = ref(null)
const artInstance = ref({})
const artOption = ref({})
const artStyle = ref({
  width: '100%',
  height: '180px',
})

const _pageKey = '_key_app_page_video_play_'

const onBeforeMountHandler = () => {
  addControlEventHandler()

  checkUpdateVideo(route.value.params)
}

const checkUpdateVideo = (params) => {
  // tmpQuery
  const v = JSON.stringify(params)

  vid.value = route.value.params.vid
  pid.value = route.value.params.pid

  if (v != tmpQuery.value) {
    tmpQuery.value = v

    if (timer.value) {
      clearInterval(timer.value)
    }
    video.value = null
    source.value = null
    artInstance.value = null
    artOption.value = null

    loadVideoSource(route.value.params.vid, route.value.params.pid)
    loadVideo(route.value.params.vid)
  }
}

const onMountedHandler = () => {
  artStyle.value.height = `${computePlayerHeight()}px`
  window.onresize = () => {
    artStyle.value.height = `${computePlayerHeight()}px`
  }
}

const onBeforeUpdateHandler = () => {
  checkUpdateVideo({ params: route.value.params, query: route.value.query })
}
const onUpdatedHandler = () => {}

const computePlayerHeight = () => {
  let pH = 180
  if (window.innerWidth <= 370) {
    pH = 180
  } else if (window.innerWidth <= 370 + 200) {
    pH = 220
  } else if (window.innerWidth <= 370 + 200 * 2) {
    pH = 320
  } else if (window.innerWidth <= 370 + 200 * 3) {
    pH = 420
  } else {
    pH = 560
  }
  return pH
}

const getHlsOptions = () => {
  return {
    plugins: [
      // https://artplayer.org/?libs=https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js%0A./uncompiled/artplayer-plugin-hls-control/index.js&example=hls.control
      artplayerPluginHlsControl({
        quality: {
          getName: (level) => level.height + 'P',
          title: 'Quality',
          auto: 'Auto',
        },
        audio: {
          control: true,
          setting: true,
          getName: (track) => track.name,
          title: 'Audio',
          auto: 'Auto',
        },
      }),
    ],
    type: 'm3u8',
    customType: {
      m3u8: function playM3u8(video, url, art) {
        if (Hls.isSupported()) {
          if (art.hls) art.hls.destroy()
          const hls = new Hls()
          hls.loadSource(url)
          hls.attachMedia(video)
          art.hls = hls
          art.on('destroy', () => hls.destroy())
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url
        } else {
          art.notice.show = 'Unsupported playback format: m3u8'
        }
      },
    },
  }
}

const getControls = () => {
  return {
    controls: [
      {
        position: 'right',
        html: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M200-160v-240h120v240H200Zm240 0v-440h120v440H440Zm240 0v-640h120v640H680Z"/></svg>`,
        click: () => {
          networkCheck(artOption.value.url)
        }
      }
    ]
  }
}

const checkSourceUrl = (url, errorCallback = null) => {
  const http = axios.create({ baseURL: apiUrl, timeout: 1000 * 20 })
  http.get(url).then(resp => {
    console.log('[resp+++]', resp)
  }).catch(err => {
    // console.log('[axios.Error]', err)
    if (err.code === 'ERR_NETWORK') {
      console.log('[axios.Error2020]', err.code, err)
      if (typeof errorCallback === 'function') {
        errorCallback()
      }
    }
  })
}

const loadVideoSource = (vid, pid, count = 0) => {
  loadingBar.value!.start()
  httpVideoSource(vid, pid, getCurrentSource(route.value), count !== 0)
    .then((resp) => {
      if (count <= 1) {
        checkSourceUrl(resp.data.url, () => {
          loadVideoSource(vid, pid, ++count)
        })
      }
      source.value = resp.data
      if (resp.data.type === 'hls') {
        artOption.value = {
          url: resp.data.url,
          fullscreen: true,
          fullscreenWeb: true,

          ...getHlsOptions(),
          ...getControls()
        }
      } else {
        artOption.value = {
          url: resp.data.url,
          fullscreen: true,
          fullscreenWeb: true
          // ...getControls()
        }
      }
    })
    .catch((err) => {
      console.log('[httpVideoSource.Error]', err)
    })
    .finally(() => {
      loadingBar.value!.finish()
    })
}
const networkCheck = (playUrl) => {
  httpPlayUrlNetworkCheck(playUrl).then(resp => {
    console.log('[httpPlayUrlNetworkCheck.resp]', resp.data.resolved)
    const resolved = resp.data.resolved.map(item => {
      return `<div><span class="sp1">${item.addr}</span>(<span class="sp2">${item.ip}</span>) <span class="sp3">${item.url}</span></div>`
    })

    artInstance.value.layers.add({
      name: 'network',
      html: resolved.join(''),
      style: {
        position: 'absolute',
        bottom: '70px',
        left: '20px',
        lineHeight: '150%'
      }
    })

    setTimeout(() => {
      // Delete the layer by name
      artInstance.value.layers.remove('network')
    }, 4000)

  }).catch(err => {
    // console.log('[httpPlayUrlNetworkCheck.Error]', err)
    artInstance.value.notice.show = '网络检测失败：' + err
  })
}

const loadVideo = (vid) => {
  httpVideo(vid, getCurrentSource(route.value))
    .then((resp) => {
      video.value = resp.data
    })
    .catch((err) => {
      console.log('[httpVideo.Error]', err)
    })
}

// const videoSourceList = computed(formatVideoSourceMap(video.value?.links))
const videoSourceList = computed(() => {
  return formatVideoSourceMap(video.value.links)
})

const getArtInstance = (art) => {
  console.info('[art]', art)
  artInstance.value = art
  art.on('ready', async () => {
    const _findHistory = await findHistory(getCurrentSource(route.value), vid.value, pid.value)
    if (
      _findHistory &&
      _findHistory.lastTime &&
      _findHistory.duration - _findHistory.lastTime >= 60
    ) {
      art.seek = _findHistory.lastTime
      message.value.info('跳转到最新进度播放')
    }
    art.play()
  })

  art.on('play', () => {
    console.info('play')
    handlerTimeUpdate()
  })

  networkCheck(artOption.value.url)

}

const handlerTimeUpdate = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  timer.value = setInterval(() => {
    addHistoryWarp()
  }, 5000)
}

const addHistoryWarp = async () => {
  const _source = getCurrentSource(route.value)
  const find = await findHistory(_source, vid.value, pid.value)
  if (!find) {
    await addHistory({
      source: _source,
      vid: vid.value,
      pid: pid.value,
      name: video.value.name,
      thumb: video.value.thumb,
      url: source.value.url,
      type: source.value.type,
      duration: artInstance.value.duration,
      lastTime: artInstance.value.currentTime,
      updated_at: Date.now(),
    })
  } else {
    await updateHistory(find.id, {
      lastTime: artInstance.value.currentTime,
      updated_at: Date.now(),
    })
  }
}

const onBeforeUnmountHandler = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  removeEventHandler(_pageKey)
}

const addControlEventHandler = () => {
  addEventHandler(EventName.Message, _pageKey, (data: any) => {
    switch (data.event) {
      case ControlEvent.Mute:
        artInstance.value.muted = !artInstance.value.muted
        break
      case ControlEvent.Fullscreen:
        artInstance.value.fullscreen = true
        break
      case ControlEvent.FullscreenExit:
        artInstance.value.fullscreen = false
        break
      case ControlEvent.Qrcode:
        break
      case ControlEvent.Info:
        artInstance.value.controls.show = true
        break
      case ControlEvent.Volume:
        if (data.value <= 0) {
          artInstance.value.volume -= 0.1
        }
        if (data.value > 0) {
          artInstance.value.volume += 0.1
        }
        break
      case ControlEvent.Back:
        artInstance.value.backward = 15
        break
      case ControlEvent.Play:
        artInstance.value.play()
        break
      case ControlEvent.Pause:
        artInstance.value.pause()
        break
      case ControlEvent.Forward:
        artInstance.value.forward = 15
        break
    }
  })
}

export default defineComponent({
  components: {
    NEllipsis,
    AppFooter,
    NH2,
    AppSourceList,
    AppHeader,
    AppArtplayer,
    NText,
    NCollapseItem,
    NCollapse,
  },
  setup() {
    route.value = useRoute()
    loadingBar.value = useLoadingBar()

    notification.value = useNotification()
    message.value = useMessage()

    onBeforeMount(onBeforeMountHandler)
    onMounted(onMountedHandler)
    onBeforeUpdate(onBeforeUpdateHandler)
    onUpdated(onUpdatedHandler)
    onBeforeUnmount(onBeforeUnmountHandler)

    watch(route, (newValue) => {
      console.log('[route]', newValue)
    })

    return {
      source,
      video,
      videoSourceList,
      artOption,
      artStyle,
      getArtInstance,
      vid,
      pid,
    }
  },
})
</script>

<style scoped>
.n-h2 {
  margin: 5px 0 5px 0 !important;
}

video {
  background-color: #2c3e50;
  border-radius: 4px;
}
</style>
