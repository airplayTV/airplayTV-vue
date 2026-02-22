<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div v-if="video === false" class="flex-column flex-justify-center">
        <div class="padding-30px"></div>
        <div class="padding-30px"></div>
        <div class="padding-30px"></div>
        <n-spin size="large" />
      </div>
      <div style="padding: 0 10px" v-else-if="video">
        <div class="flex-row flex-align-center flex-justify-center">
          <n-h2 class="text-align-center">{{ video.name }}</n-h2>
          <div class="padding-2px"></div>
          <RouterLink :to="`/video/search?page=1&keyword=${video.name}`" target="_blank">
            <n-icon color="#5e5b5b" size="20">
              <SearchSharp />
            </n-icon>
          </RouterLink>
        </div>

        <!--<video :src="video.url" style="width: 100%" />-->
        <div style="border-radius: 4px; display: flex; min-height: 180px" class="player-container">
          <AppArtplayer
              v-if="playType===playTypeOption.art && artOption"
              :key="artOption"
              :option="artOption"
              :video="video"
              :style="artStyle"
              @get-instance="getArtInstance"
          />
          <iframe
              v-if="playType===playTypeOption.iframe"
              style="border:none; background-color: #f2f2f2;"
              allowfullscreen
              allow="fullscreen"
              :style="{height: artStyle.height, width : artStyle.width}"
              :src="artOption.url" />
        </div>

        <div style="color: dimgray; word-wrap: break-word" v-if="source">
          <div style="padding: 8px 0">
            <n-space>
              <n-text depth="3">{{ source.url }}</n-text>
              <n-text class="bottom-dashed avp-link" @click="gotoAvp">
                <b>libmedia(avp)解码</b>
              </n-text>
            </n-space>
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
        <div v-else class="padding-5px"></div>

        <n-collapse accordion default-expanded-names="1">
          <template #header-extra>
            <div class="color-grey">
              快捷键：上一集(ctrl+p)，下一集(ctrl+n)
            </div>
          </template>
          <n-collapse-item title="选集" name="1">
            <AppSourceList v-if="video" :vid="vid" :pid="pid" :source-list="videoSourceList" />
          </n-collapse-item>
        </n-collapse>
      </div>
      <div v-else>
        <div class="padding-30px"></div>
        <div class="padding-30px"></div>
        <div class="padding-30px"></div>
        <n-result status="404" title="暂无数据" :description="errMsg"></n-result>
      </div>

    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import {computed, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, watch,} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import {httpPlayUrlNetworkCheck, httpVideo, httpVideoSource} from '../helpers/api'
import {
  NCollapse,
  NCollapseItem,
  NEllipsis,
  NH2,
  NIcon,
  NResult,
  NSpace,
  NSpin,
  NText,
  useLoadingBar,
  useMessage
} from 'naive-ui'
import AppSourceList from '@/components/AppSourceList.vue'
import AppArtplayer from '@/components/AppArtplayer.vue'
import {formatVideoSourceMap} from '@/helpers/app'
import Hls from 'hls.js'
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control'
import AppFooter from '@/components/AppFooter.vue'
import {addHistory, addTimeline, findHistory, findTimeline, updateHistory, updateTimeline} from '@/helpers/db'
import {
  addEventHandler,
  ControlEventBack,
  ControlEventForward,
  ControlEventFullscreen,
  ControlEventFullscreenExit,
  ControlEventInfo,
  ControlEventMute,
  ControlEventPause,
  ControlEventPlay,
  ControlEventQrcode,
  ControlEventVolume,
  EventNameMessage,
  removeEventHandler,
} from '@/helpers/websocket'
import axios from 'axios'
import {apiUrl} from '@/config'
import {useAppStore} from "@/stores/app.js";
import {SearchSharp} from '@vicons/material'
import hotkeys from 'hotkeys-js';

const route = useRoute()
const router = useRouter()
const loadingBar = useLoadingBar()
const message = useMessage()
const appStore = useAppStore()


const playTypeOption = {
  art: 0,
  iframe: 1,
}

const timer = ref(null)
const vid = ref(null)
const pid = ref(null)
const pname = ref(null)
const tmpQuery = ref(null)
const playType = ref(playTypeOption.art)
const errMsg = ref('')

const source = ref(null)
const video = ref(false)
const artInstance = ref({})
const artOption = ref({})
const artStyle = ref({
  width: '100%',
  height: '180px',
})

const _pageKey = '_key_app_page_video_play_'

const onBeforeMountHandler = () => {
  addControlEventHandler()

  checkUpdateVideo(route.params)

  hotkeys('ctrl+p,ctrl+n', function (event, handler) {
    if (!artInstance.value.isReady) {
      return
    }
    switch (handler.key) {
      case 'ctrl+p':
        handleNextVideo(-1)
        break;
      case 'ctrl+n':
        handleNextVideo(1)
        break;
    }
  })

}

const checkUpdateVideo = (params) => {
  // tmpQuery
  const v = JSON.stringify(params)

  vid.value = route.params.vid
  pid.value = route.params.pid

  if (v !== tmpQuery.value) {
    tmpQuery.value = v

    if (timer.value) {
      clearInterval(timer.value)
    }
    video.value = false
    source.value = null
    artInstance.value = null
    artOption.value = null

    loadVideoSource(route.params.vid, route.params.pid)
    loadVideo(route.params.vid)
  }
}

const onMountedHandler = () => {
  artStyle.value.height = `${computePlayerHeight()}px`
  window.onresize = () => {
    artStyle.value.height = `${computePlayerHeight()}px`
  }
}

const onBeforeUpdateHandler = () => {
  source.value = Object.assign({}, source.value, { id: route.params.pid })
  handleNextVideo(0)
}
const onUpdatedHandler = () => {
}

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
    // console.log('[resp+++]', resp)
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
  loadingBar.start()
  httpVideoSource(vid, pid, appStore.source, count !== 0).then((resp) => {
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
        pip: true,
        autoMini: true,
        airplay: true,
        autoOrientation: true,
        autoplay: true,

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
  }).catch((err) => {
    console.log('[httpVideoSource.Error]', err)
    if (artInstance.value) {
      artInstance.value.notice.show = `无法播放：${err}`
    } else {
      message.warning(`无法播放：${err}`)
    }
  }).finally(() => {
    loadingBar.finish()
  })
}
const networkCheck = (playUrl) => {
  httpPlayUrlNetworkCheck(playUrl).then(resp => {
    // console.log('[httpPlayUrlNetworkCheck.resp]', resp.data.resolved)
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
  httpVideo(vid, appStore.source).then((resp) => {
    video.value = resp.data;
    (resp.data.links || []).filter(item => {
      if (item.id === pid.value) {
        pname.value = item.name
      }
    })
  }).catch((err) => {
    errMsg.value = err
    video.value = null
    console.log('[httpVideo.Error]', err)
  })
}

// const videoSourceList = computed(formatVideoSourceMap(video.value?.links))
const videoSourceList = computed(() => {
  return formatVideoSourceMap(video.value.links)
})

const getArtInstance = (art) => {
  // console.info('[art]', art)
  artInstance.value = art
  art.on('ready', async () => {
    const _findTimeline = await findTimeline(appStore.source, vid.value, pid.value)
    if (
        _findTimeline &&
        _findTimeline.lastTime &&
        _findTimeline.duration - _findTimeline.lastTime >= 60
    ) {
      art.seek = _findTimeline.lastTime
      message.info('跳转到最新进度播放')
    }
    art.play().then(resp => {
    }).catch(err => {
      console.info('[err]', err)
      message.info(`${err}`)
    })
  })

  art.on('play', () => {
    console.info('play')
    handlerTimeUpdate()
  })
  art.on('error', (error, reconnectTime) => {
    // if (reconnectTime >= Artplayer.RECONNECT_TIME_MAX) {
    //   playType.value++
    // }
  })
  art.on('video:ended', (e) => {
    if (artInstance.value.currentTime > 0 && artInstance.value.currentTime === artInstance.value.duration) {
      handleNextVideo(1)
    }
  })

  if (artOption.value && artOption.value.url) {
    networkCheck(artOption.value.url)
  }

}

const handleNextVideo = (next = 0) => {
  let found = null
  const _pid = source.value.id
  const tmpLinks = video.value.links
  for (let i = 0; i < tmpLinks.length; i++) {
    if (tmpLinks[i].id === _pid) {
      found = true
    }
    if (found && i + next < tmpLinks.length) {
      // console.log('[即将播放]', tmpLinks[i + next])
      playNextVideo(tmpLinks[i + next])
    }
    if (found) {
      break
    }
  }
}

const playNextVideo = (nextSource) => {
  if (!nextSource) {
    return
  }
  router.replace(`/video/play/${vid.value}/${nextSource.id}?_source=${appStore.source}&from=next`)

  loadingBar.start()
  httpVideoSource(vid.value, nextSource.id, appStore.source, false).then((resp) => {
    artOption.value.video = Object.assign({}, video.value, { title: `${video.value.name} ${nextSource.name || ''}` })
    artInstance.value.switchUrl(resp.data.url);
  }).catch((err) => {
    console.log('[httpVideoSource.Error]', err)
    if (artInstance.value) {
      artInstance.value.notice.show = `无法播放：${err}`
    } else {
      message.warning(`无法播放：${err}`)
    }
  }).finally(() => {
    loadingBar.finish()
  })

}

const handlerTimeUpdate = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  timer.value = setInterval(() => {
    addTimelineWarp()
    addHistoryWarp()
  }, 5000)
}

const addTimelineWarp = async () => {
  const _source = appStore.source
  const find = await findTimeline(_source, vid.value, pid.value)
  if (!find) {
    await addTimeline({
      source: _source,
      vid: vid.value,
      pid: pid.value,
      duration: artInstance.value.duration,
      lastTime: artInstance.value.currentTime,
      updated_at: Date.now(),
    })
  } else {
    await updateTimeline(find.id, {
      duration: artInstance.value.duration,
      lastTime: artInstance.value.currentTime,
      updated_at: Date.now(),
    })
  }
}

const addHistoryWarp = async () => {
  const _source = appStore.source
  const find = await findHistory(_source, vid.value, pid.value)
  if (!find) {
    await addHistory({
      source: _source,
      vid: vid.value,
      pid: pid.value,
      name: video.value.name,
      pname: pname.value,
      thumb: video.value.thumb,
      url: source.value.url,
      type: source.value.type,
      duration: artInstance.value.duration,
      lastTime: artInstance.value.currentTime,
      updated_at: Date.now(),
    })
  } else {
    await updateHistory(find.id, {
      pid: pid.value,
      pname: pname.value,
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
  addEventHandler(EventNameMessage, _pageKey, (data) => {
    switch (data.event) {
      case ControlEventMute:
        artInstance.value.muted = !artInstance.value.muted
        break
      case ControlEventFullscreen:
        artInstance.value.fullscreen = true
        break
      case ControlEventFullscreenExit:
        artInstance.value.fullscreen = false
        break
      case ControlEventQrcode:
        break
      case ControlEventInfo:
        artInstance.value.controls.show = true
        break
      case ControlEventVolume:
        if (data.value <= 0) {
          artInstance.value.volume -= 0.1
        }
        if (data.value > 0) {
          artInstance.value.volume += 0.1
        }
        break
      case ControlEventBack:
        artInstance.value.backward = 15
        break
      case ControlEventPlay:
        artInstance.value.play().then(resp => {
        }).catch(err => {
          message.info(`${err}`)
        })
        break
      case ControlEventPause:
        artInstance.value.pause()
        break
      case ControlEventForward:
        artInstance.value.forward = 15
        break
    }
  })
}

const gotoAvp = () => {
  const q = btoa(JSON.stringify({
    id: encodeURIComponent(`${source.value.vid},${source.value.id}`),
    name: encodeURIComponent(`${source.value.name} ${pname.value}`),
    url: encodeURIComponent(source.value.url),
    t: Date.now(),
  }))

  playType.value = playTypeOption.iframe
  artOption.value.url = `https://libmedia-avp.pages.dev/?config=${q}`

  message.warning('解码资源加载较慢，请稍等', { duration: 12 * 1000 })
  message.warning('解码资源加载较慢，请稍等', { duration: 12 * 1000 })
  message.warning('解码资源加载较慢，请稍等', { duration: 12 * 1000 })
  // window.location.href = `https://libmedia-avp.pages.dev/?config=${q}`
}

onBeforeMount(onBeforeMountHandler)
onMounted(onMountedHandler)
onBeforeUpdate(onBeforeUpdateHandler)
onUpdated(onUpdatedHandler)
onBeforeUnmount(onBeforeUnmountHandler)

watch(route, (newValue) => {
  console.log('[route]', newValue)
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

.bottom-dashed {
  border-bottom: 1px dashed #50555b;
  cursor: pointer;
}

.avp-link {
  color: #000000;
  font-family: DM Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
}

.player-container {
  background-color: rgba(246, 246, 246, 1)
}

@media (min-width: 0px) and (max-width: 600px) {
  .player-container {
    min-height: 180px !important;
  }
}

@media (min-width: 600px) and (max-width: 900px) {
  .player-container {
    min-height: 280px !important;
  }
}

@media (min-width: 900px) and (max-width: 9000px) {
  .player-container {
    min-height: 380px !important;
  }
}

</style>
