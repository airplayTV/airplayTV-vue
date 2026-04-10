<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 0 10px;margin: 0 0 0 0;" v-if="source && source.type === sourceTypeOption.mp3">
        <div class="audio-container width-100 flex-column flex-justify-between">

          <div class="flex-row flex-1">
            <div class="side">
              <div class="thumb-container">
                <n-image :src="video.thumb" class="thumb" object-fit="fill" />
                <div v-if="false" class="action-container flex-column flex-justify-center flex-align-center">
                  <n-icon v-if="false" color="#ffffff" size="126" @click="onPauseAudio">
                    <PauseCircleOutlineOutlined />
                  </n-icon>
                  <n-icon v-else color="#ffffff" size="126" @click="onPlayAudio">
                    <PlayCircleFilledWhiteOutlined />
                  </n-icon>
                </div>
              </div>
            </div>
            <div class="lrc flex-1 flex-column" style="width: 0">
              <div class="flex-row">
                <n-h2>{{ video.name || 'Untitled' }}</n-h2>
                <div class="fav flex-row">
                  <div v-if="false" @click="onRemoveCollect" class="flex-row flex-align-center flex-justify-center">
                    <n-icon color="red" size="20">
                      <FavoriteFilled />
                    </n-icon>
                    <n-text depth="3">&nbsp;取消收藏</n-text>
                  </div>
                  <div v-if="true" @click="onAddCollect" class="flex-row flex-align-center flex-justify-center">
                    <n-icon color="#999999" size="20">
                      <FavoriteBorderFilled />
                    </n-icon>
                    <n-text depth="3">&nbsp;收藏</n-text>
                  </div>

                </div>
              </div>
              <div v-if="video.actors">{{ video.actors }}</div>
              <div class="padding-5px"></div>
              <n-scrollbar class="  ">
                {{ video.intro || '暂无简介' }}
              </n-scrollbar>

              <n-text>地址：</n-text>
              <a
                  v-if="source.url"
                  :href="source.url"
                  target="_blank"
                  class="source-url bottom-dashed text-ellipsis"
                  :title="source.source">
                {{ source.url }}
              </a>

            </div>
          </div>

          <AudioPlayer
              :key="playList"
              :music="playList"
              :index="playIndex"
              @next="onNextAudio"
              @prev="onPrevAudio"
              @timeupdate="onAudioEvent"
              @playing="onAudioEvent"
              @changed="onAudioChange"
          />

        </div>

        <div class="padding-5px"></div>

        <AppAudioList
            v-if="video"
            :vid="vid"
            :pid="pid"
            :play-index="playIndex"
            :source-list="videoSourceList"
            @changed="onAudioListChange" />

      </div>
      <div style="padding: 0 10px" v-else-if="source && source.url">
        <div class="flex-row flex-align-center flex-justify-center">
          <n-h2 class="text-align-center">{{ video.name }}</n-h2>
          <div class="padding-2px"></div>
          <RouterLink :to="`/video/search?page=1&keyword=${video.name}`" target="_blank">
            <n-icon color="#5e5b5b" size="20">
              <SearchSharp />
            </n-icon>
          </RouterLink>
        </div>

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
              v-else-if="playType===playTypeOption.iframe"
              style="border:none; background-color: #f2f2f2;"
              allowfullscreen
              allow="fullscreen"
              :style="{height: artStyle.height, width : artStyle.width}"
              :src="artOption.url" />
          <div v-else-if="errMsg" class="flex-column flex-justify-center flex-1 flex-align-center">
            <n-text depth="3">{{ errMsg }}</n-text>
          </div>
          <div v-else class="flex-column flex-justify-center flex-1">
            <n-spin size="large" />
          </div>
        </div>

        <div style="color: dimgray; word-wrap: break-word">
          <div style="padding: 8px 0">
            <n-space>
              <a
                  v-if="source.url"
                  :href="source.url"
                  target="_blank"
                  class="source-url bottom-dashed"
                  :title="source.source">
                {{ source.url }}
              </a>
              <n-text class="bottom-dashed avp-link" @click="gotoAvp">
                <b>libmedia(avp)解码</b>
              </n-text>
            </n-space>
          </div>

          <div class="padding-2px"></div>

          <n-ellipsis :line-clamp="5" expand-trigger="click" :tooltip="false">
            <b>
              <n-text depth="2">简介：</n-text>
            </b>
            <n-text depth="3">
              {{ video.intro }}
            </n-text>
          </n-ellipsis>
        </div>

        <div class="padding-5px"></div>

        <n-collapse accordion default-expanded-names="1">
          <template #header-extra>
            <div class="color-grey font-size-12px">
              快捷键：上一集(p)，下一集(n)，全屏切换(f)
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

    <div v-if="source && source.type === sourceTypeOption.mp3" style="width: 100%; height: 80px;"></div>

    <n-modal
        v-model:show="showCollectModal"
        style="width: 520px"
        preset="card"
        title="添加到收藏夹"
        :show-mask="true">

      <n-form :label-width="80">
        <n-form-item label="用户" path="phone" required>
          <n-input v-model:value="formCollect.user" placeholder="输入用户账号/手机号" />
        </n-form-item>
        <n-form-item label="收藏夹" path="name" required>
          <n-select
              v-model:value="formCollect.name"
              clearable filterable
              :tag="true"
              :options="collectOptions"
              placeholder="请选择收藏夹/输入新建收藏夹" />
        </n-form-item>
        <n-space justify="end">
          <n-button type="primary" @click="handleCreateCollect">
            添加
          </n-button>
        </n-space>

      </n-form>

    </n-modal>

  </div>
</template>

<script setup>
import {computed, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, watch,} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import {httpCollectAdd, httpPlayUrlNetworkCheck, httpVideo, httpVideoSource} from '../helpers/api'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NEllipsis,
  NForm,
  NFormItem,
  NH2,
  NIcon,
  NImage,
  NInput,
  NModal,
  NResult,
  NScrollbar,
  NSelect,
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
import {
  FavoriteBorderFilled,
  FavoriteFilled,
  PauseCircleOutlineOutlined,
  PlayCircleFilledWhiteOutlined,
  SearchSharp
} from '@vicons/material'
import hotkeys from 'hotkeys-js';
import AudioPlayer from "@/components/AudioPlayer.vue";
import AppAudioList from "@/components/AppAudioList.vue";

const route = useRoute()
const router = useRouter()
const loadingBar = useLoadingBar()
const message = useMessage()
const appStore = useAppStore()


const playTypeOption = {
  art: 0,
  iframe: 1,
}
const sourceTypeOption = {
  mp3: 'mp3',
  mp4: 'mp4',
  m3u8: 'm3u8',
}

const timer = ref(null)
const vid = ref(null)
const pid = ref(null)
const pname = ref(null)
const tmpQuery = ref(null)
const tmpUrlPath = ref(null)
const playType = ref(playTypeOption.art)
const errMsg = ref('')
const latestVideo = ref({})
let lrcTimeLine = []

const source = ref(null)
const video = ref(false)
const artInstance = ref({})
const artOption = ref({})
const artStyle = ref({
  width: '100%',
  height: '180px',
})

const apInstance = ref(null)
const playList = ref({})
const playIndex = ref(0)

const showCollectModal = ref(false)

const formCollect = ref({
  user: null,// 用户
  name: null// 收藏夹名称
})

const collectOptions = [
  { label: '默认收藏夹', value: '默认收藏夹' },
  { label: '我喜欢的音乐', value: '我喜欢的音乐' },
  { label: '私藏', value: '私藏' },
]

const _pageKey = '_key_app_page_video_play_'

const onBeforeMountHandler = () => {
  latestVideo.value = appStore.latestVideo || {}

  addControlEventHandler()

  tmpUrlPath.value = route.path
  checkUpdateVideo(route.params)

  hotkeys('p,n,f', function (event, handler) {
    if (!artInstance.value.isReady) {
      return
    }
    switch (handler.key) {
      case 'p':
        handleNextVideo(-1)
        break;
      case 'n':
        handleNextVideo(1)
        break;
      case 'f':
        artInstance.value.fullscreen = !artInstance.value.fullscreen
        break
      default:
        // console.log('[handler]', handler.keys)
    }
  })

}

const checkUpdateVideo = async (params) => {
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

    await loadVideoAsync(route.params.vid)
    tryHandlerVideoSource(route.params.vid, route.params.pid)
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
  if (tmpUrlPath.value !== route.path) {
    tmpUrlPath.value = route.path
    tryHandlerVideoSource(route.params.vid, route.params.pid)
  }
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

const checkSourceUrlAsync = (url) => {
  return new Promise((resolve, reject) => {
    try {
      axios.create({ baseURL: apiUrl, timeout: 1000 * 5, maxContentLength: 1000, }).head(url).then(resp => {
        resolve(resp)
      }).catch(e => {
      })
    } catch (e) {
    }

    try {
      axios.create({ baseURL: apiUrl, timeout: 1000 * 5, maxContentLength: 1000, }).get(url).then(resp => {
        resolve(resp)
      }).catch(err => {
        reject(err)
      })
    } catch (e) {
      reject(err)
    }
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
    noticeToVideo('网络检测失败：' + err)
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

const loadVideoAsync = async (vid) => {
  try {
    const resp = await httpVideo(vid, appStore.source)

    video.value = resp.data;
    video.value.name = video.value.name || latestVideo.value.name// 修正图片显示
    video.value.thumb = video.value.thumb || latestVideo.value.thumb// 修正图片显示
    ;(resp.data.links || []).filter(item => {
      if (item.id === pid.value) {
        pname.value = item.name
      }
    })

  } catch (e) {
    console.log('[加载视频失败]', { e })
  }
}

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
      noticeToVideo(`跳转到最新进度播放`)
    }
    art.play().then().catch(e => {
    })
  })

  art.on('play', () => {
    console.info('play')
    handlerTimeUpdate()

    showVideoTitle()

  })
  art.on('error', (error, reconnectTime) => {
    console.log('[art.error]', error)
    noticeToVideo(`错误：${error}`)
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

const showVideoTitle = () => {
  if (!artInstance.value || !artOption.value) {
    return
  }
  noticeToVideo(`正在播放：${artOption.value.video.title}`)
  setTimeout(() => {
    noticeToVideo(`正在播放：${artOption.value.video.title}`)
  }, 1000)
  setTimeout(() => {
    noticeToVideo(`正在播放：${artOption.value.video.title}`)
  }, 2500)
  setTimeout(() => {
    noticeToVideo(`正在播放：${artOption.value.video.title}`)
  }, 3500)
}

const noticeToVideo = (msg) => {
  if (artInstance.value) {
    artInstance.value.notice.show = msg
  }
}

const handleNextVideo = (next = 0) => {
  let found = null
  const _pid = source.value.id
  const tmpLinks = video.value.links
  for (let i = 0; i < tmpLinks.length; i++) {
    if (found) {
      break
    }
    if (tmpLinks[i].id === _pid) {
      found = true
    }
    if (found && i === 0 && next < 0) {
      noticeToVideo(`没有可播放节目`)
      continue
    }
    if (found && !tmpLinks[i + next]) {
      noticeToVideo(`没有可播放节目`)
      continue
    }
    if (found && tmpLinks[i + next]) {
      console.log('[即将播放]', tmpLinks[i + next])
      playNextVideo(tmpLinks[i + next])
    }
  }
}

const playNextVideo = (nextSource) => {
  if (nextSource) {
    router.replace(`/video/play/${vid.value}/${nextSource.id}?_source=${appStore.source}&from=next`)
    tryHandlerVideoSource(vid.value, nextSource.id)
  }

}

const tryHandlerVideoSource = async (vid, pid, _m3u8p = false) => {
  errMsg.value = null

  if (artInstance.value) {
    artInstance.value.pause()
  }
  let respSource;
  try {
    respSource = await httpVideoSource(vid, pid, appStore.source, _m3u8p)
  } catch (e) {
    errMsg.value = e
    console.error('[httpVideoSource.Error]', e)
  }

  try {
    if (respSource && respSource.data && respSource.data.url && respSource.data.type !== sourceTypeOption.mp3) {
      await checkSourceUrlAsync(respSource.data.url)
    }
  } catch (e) {
    console.log('[checkSourceUrlAsync.Error]', e)

    if (e.code === 'ERR_NETWORK' && !_m3u8p) {
      return await tryHandlerVideoSource(vid, pid, true)
    }
  }

  if (!respSource) {
    errMsg.value = errMsg.value || '视频加载失败'
    return
  }

  source.value = respSource.data

  console.log('[播放文件测试OK]', {
    url: respSource.data.url,
    source: respSource.data,
    artplayer: artInstance.value,
  })

  const findLink = (video.value.links || []).find(item => item.id === pid) || {}
  // 如果是mp3且source.name空，则可能需要修正标题
  if (source.value.type === sourceTypeOption.mp3 && !source.value.name && video.value.name !== findLink.name) {
    video.value = Object.assign({}, video.value, { name: findLink.name })
  }
  video.value.name = video.value.name || latestVideo.value.name// 修正图片显示
  video.value.thumb = video.value.thumb || latestVideo.value.thumb// 修正图片显示
  video.value.links = video.value.links.map(row => {
    row.name = row.name || video.value.name
    return row
  })

  const tmpVideo = Object.assign(
      {},
      video.value,
      { title: `${video.value.name} ${findLink.name || ''}` }
  )
  const otherOption = Object.assign({}, {
    video: tmpVideo,
    fullscreen: true,
    fullscreenWeb: true,
    pip: true,
    autoMini: true,
    airplay: true,
    autoOrientation: true,
    autoplay: true,
  })


  if (source.value.type === sourceTypeOption.mp3) {
    ;(video.value.links || []).filter((row, idx) => {
      if (row.id === pid) {
        playIndex.value = idx
      }
    })
    playList.value = (video.value.links || []).map(row => {
      if (row.ctx && row.ctx.collect_id) {
        return {
          id: row.id,
          title: row.name,
          artist: row.ctx.name,
          src: async () => {
            const resp = await httpVideoSource(row.ctx.collect_id, row.ctx.id, appStore.source)
            return resp.data.url
          },
          pic: row.ctx.thumb,
          lrc: '',
        }
      }
      return {
        title: video.value.name,
        artist: video.value.actors,
        src: source.value.url,
        pic: video.value.thumb,
        lrc: '',
      }
    })
  } else if (artInstance.value) {
    artOption.value.video = tmpVideo
    await artInstance.value.switchUrl(respSource.data.url);
    showVideoTitle()
  } else if (respSource.data.type === 'hls') {
    artOption.value = Object.assign({}, otherOption, {
      url: respSource.data.url,
      ...getHlsOptions(),
      ...getControls()
    })
    showVideoTitle()
  } else {
    artOption.value = Object.assign({}, otherOption, {
      url: respSource.data.url,
      ...getControls()
    })
    showVideoTitle()
  }


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

const getPlayerTimeCtx = (ctx) => {
  let duration = 0
  let lastTime = 0
  if (source.value.type === sourceTypeOption.mp3 && ctx.target) {
    duration = ctx.target.duration
    lastTime = ctx.target.currentTime
  } else if (artInstance.value) {
    duration = artInstance.value.duration
    lastTime = artInstance.value.currentTime
  }
  return { duration, lastTime }
}

const addTimelineWarp = async (ctx) => {
  const { duration, lastTime } = getPlayerTimeCtx(ctx)
  const _source = appStore.source
  const find = await findTimeline(_source, vid.value, pid.value)
  if (!find) {
    await addTimeline({
      source: _source,
      vid: vid.value,
      pid: pid.value,
      duration: duration,
      lastTime: lastTime,
      updated_at: Date.now(),
    })
  } else {
    await updateTimeline(find.id, {
      duration: duration,
      lastTime: lastTime,
      updated_at: Date.now(),
    })
  }
}

const addHistoryWarp = async (ctx) => {
  const { duration, lastTime } = getPlayerTimeCtx(ctx)

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
      duration: duration,
      lastTime: lastTime,
      updated_at: Date.now(),
    })
  } else {
    await updateHistory(find.id, {
      pid: pid.value,
      name: video.value.name,
      pname: pname.value,
      thumb: video.value.thumb,
      lastTime: lastTime,
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
        artInstance.value.fullscreenWeb = true
        break
      case ControlEventFullscreenExit:
        artInstance.value.fullscreen = false
        artInstance.value.fullscreenWeb = false
        break
      case ControlEventQrcode:
        break
      case ControlEventInfo:
        artInstance.value.controls.show = true
        noticeToVideo(`正在播放：${artOption.value.video.title}`)
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

const parseLrcTimeLine = (lrcTxt) => {
  const pattern = /(\d+):(\d+)[:|.](\d+)/;
  return lrcTxt.split('\n').map(row => {
    const m = row.match(pattern)
    if (m && m.length >= 4) {
      row = { time: (60 * m[1] + 1 * m[2]) * 1000 + 1 * m[3], text: row }
    } else {
      row = { time: -1, text: row }
    }
    return row
  })
}

const gotoAvp = () => {
  if (!source.value.url) {
    return message.warning('没有可播放数据')
  }

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


const onEmptyEvent = (ctx) => {
  // console.log('[onEmptyEvent]', ctx)
}

const onAudioEvent = (ctx) => {
  // console.log('[onAudioEvent]', ctx)
  switch (ctx.type) {
    case 'play':
      break
    case 'pause':
      break
    case 'ended':
      if (ctx.timeStamp > 5000) {
        handleNextVideo(1)
      }
      break
    case 'timeupdate':
      if (ctx.timeStamp > 5000) {
        addTimelineWarp(ctx)
        addHistoryWarp(ctx)
      }
      break
    case 'loadeddata':
      apInstance.value = ctx.target
      break
  }
}

const onAudioChange = (idx, ctx) => {
  playIndex.value = idx
  video.value = Object.assign({}, video.value, {
    name: ctx.title,
    thumb: ctx.pic,
    actors: ctx.actors,
  })
  source.value = Object.assign({}, source.value, {
    url: ctx.src
  })
  pname.value = ''
}

const onAudioListChange = (idx, ctx) => {
  playIndex.value = idx
}

const onAudioTimeUpdate = (ctx) => {
  // console.log('[onAudioTimeUpdate]', ctx.timeStamp)
  for (let i = 0; i < lrcTimeLine.length; i++) {
    if (lrcTimeLine[i].time >= ctx.timeStamp) {
      console.log('[找到歌词]', lrcTimeLine[i])
      break
    }
  }
}

const onPlayAudio = () => {
  console.log('[onPlayAudio]', apInstance.value.play())
  console.log('[inst]', apInstance.value)
}

const onPauseAudio = () => {
  console.log('[onPauseAudio]', apInstance.value.pause())
  console.log('[inst]', apInstance.value)
}

const onAddCollect = () => {
  showCollectModal.value = true
  if (!formCollect.value.user) {
    formCollect.value.user = appStore.username
  }
  console.log('[onAddCollect]', JSON.parse(JSON.stringify({
    video: video.value,
    source: source.value,
  })))
}

const onRemoveCollect = () => {
  showCollectModal.value = true
  console.log('[onRemoveCollect]', JSON.parse(JSON.stringify({
    video: video.value,
    source: source.value,
  })))
}

const handleCreateCollect = () => {
  if (!formCollect.value.user || formCollect.value.user.length < 6) {
    return message.warning('请输入6位以上用户账号', { duration: 12 * 1000 })
  }
  if (!formCollect.value.name || formCollect.value.name.length < 2) {
    return message.warning('收藏夹名称太短', { duration: 12 * 1000 })
  }

  const p = {
    user: formCollect.value.user,
    collect_name: formCollect.value.name,
    source: appStore.source,
    vid: video.value.id,
    pid: source.value.id,
    name: video.value.name,
    thumb: video.value.thumb,
    url: source.value.source,
  }

  httpCollectAdd(p).then(resp => {
    console.log('[resp]', resp)
    message.info('已添加到收藏夹')

  }).catch(err => {
    console.log('[err]', err)
    message.warning(`${err}`)
  }).finally(() => {
    appStore.setUsername(formCollect.value.user)
    showCollectModal.value = false
  })
}

const onNextAudio = (ctx) => {
  console.log('[onNextAudio]', ctx)
}

const onPrevAudio = (ctx) => {
  console.log('[onPrevAudio]', ctx)
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

.source-url {
  color: rgb(118, 124, 130);
  text-decoration: none;

  display: inline-block;
  word-wrap: break-word;
}

.player-container {
  background-color: rgba(246, 246, 246, 0.4)
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

<style>


.audio-container {
  //background-color: rgba(246, 246, 246, 0.25);
  position: relative;

  .side {
    padding: 10px 0;
    //min-width: 480px;
    display: flex;
    //justify-content: center;
    //align-items: center;
  }

  .thumb {
    width: 360px;
    height: 360px;
    border-radius: 10px;
    background-color: #faf9f9;
  }

  .thumb-container {
    width: 360px;
    height: 360px;
    border-radius: 10px;
    position: relative;

    .action-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, .2);
      border-radius: 10px;
      cursor: pointer;
    }
  }

  .lrc {
    padding: 10px 10px;
    line-height: 180%;
    color: rgb(118, 124, 130);
  }

  .lrc-scroller {
    max-height: 444px !important;
    line-height: 200%;
  }

  .fav {
    font-size: 14px;
    margin: 0 0 0 10px;
    cursor: pointer;
  }

}

@media (min-width: 0px) and (max-width: 600px) {
  .audio-container {
    //min-height: 280px !important;
  }

  .side {
    min-width: 100%;
    padding: 20px 0 10px 0;
  }
}

@media (min-width: 600px) and (max-width: 900px) {
  .audio-container {
    //min-height: 320px !important;
  }
}

@media (min-width: 900px) and (max-width: 9000px) {
  .audio-container {
    //min-height: 520px !important;
    //padding-top: 20px;
  }

  .side {
    min-width: 400px;
  }

}

</style>