<template>

  <div style="padding: 0 10px" v-if="source">
    <div class="flex-row flex-align-center flex-justify-center">
      <n-h2 class="text-align-center">{{ video.name || 'Untitled' }}</n-h2>
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

    <div style="color: dimgray; word-wrap: break-word; line-height: 200%;">
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

    <AppAudioList
        v-if="video"
        :play-index="playIndex"
        :source-list="playList"
        @changed="onPlayListChange" />

  </div>

</template>

<script setup>

import {useAppStore} from "@/stores/app.js";
import {onBeforeMount, ref} from "vue";
import {httpVideoSource} from "@/helpers/api.js";
import {addHistoryWarp, addTimelineWarp, findSourceLink, handlerPlayList, playTypeOption} from "@/helpers/play.js";
import {SearchSharp} from '@vicons/material'
import AppArtplayer from '@/components/AppArtplayer.vue'
import {NEllipsis, NH2, NIcon, NSpace, NSpin, NText, useMessage} from 'naive-ui'
import {findTimeline} from "@/helpers/db.js";
import AppAudioList from "@/components/AppAudioVideoList.vue";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import Hls from "hls.js";

const appStore = useAppStore()
const message = useMessage()

const props = defineProps(['video'])

const video = ref({})
const source = ref({})
const playType = ref(playTypeOption.art)
const artInstance = ref({})
const artOption = ref({})
const artStyle = ref({ width: '100%', height: '180px', })
const errMsg = ref('')
const timer = ref(null)

const playIndex = ref(0)
const playList = ref({})

const tryHandlerVideoSource = async (vid, pid, _m3u8p = false) => {
  errMsg.value = null
  let respSource;
  try {
    respSource = await httpVideoSource(vid, pid, appStore.source, _m3u8p)
  } catch (e) {
    console.error('[httpVideoSource.Error]', e)
    errMsg.value = e
  }
  if (!respSource) {
    errMsg.value = errMsg.value || '视频加载失败'
    return console.log('[视频加载失败]')
  }

  source.value = respSource.data

  console.log('[获取到播放信息]', Object.assign({}, respSource.data, { url: respSource.data.url }))

  const findLink = findSourceLink(props.video.links, pid)
  playIndex.value = findLink._idx || 0
  playList.value = handlerPlayList(props.video.links, props.video, source.value)

  initVideoPlayer(findLink, source.value)
}

const initVideoPlayer = async (findLink, source) => {
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

  if (artInstance.value) {
    artOption.value.video = tmpVideo
    await artInstance.value.switchUrl(source.url);
    showVideoTitle()
  } else if (source.type === 'hls') {
    artOption.value = Object.assign({}, otherOption, {
      url: source.url,
      ...getHlsOptions(),
      ...getControls()
    })
    showVideoTitle()
  } else {
    artOption.value = Object.assign({}, otherOption, {
      url: source.url,
      ...getControls()
    })
    showVideoTitle()
  }


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

const getArtInstance = (art) => {
  console.info('[art]', art)
  artInstance.value = art
  art.on('ready', async () => {
    const _findTimeline = await findTimeline(appStore.source, video.value.id, source.value.id)
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

const handlerTimeUpdate = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  timer.value = setInterval(() => {
    console.log('[artInstance.value]', artInstance.value)
    addTimelineWarp(artInstance.value, appStore.source, video.value, source.value)
    addHistoryWarp(artInstance.value, appStore.source, video.value, source.value)
  }, 5000)
}


const noticeToVideo = (msg) => {
  if (artInstance.value) {
    artInstance.value.notice.show = msg
  }
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


const onBeforeMountHandler = () => {
  video.value = { ...props.video }

  artStyle.value.height = `${computePlayerHeight()}px`
  window.onresize = () => {
    artStyle.value.height = `${computePlayerHeight()}px`
  }

  tryHandlerVideoSource(props.video.id, props.video.links[0].id)

}

const onPlayListChange = (idx, ctx) => {
  console.log('[onPlayListChange]', idx,ctx)
  playIndex.value = idx
}

onBeforeMount(onBeforeMountHandler)


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
