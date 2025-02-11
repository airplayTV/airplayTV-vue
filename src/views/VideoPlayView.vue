<template>
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
  watch
} from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { httpVideo, httpVideoSource } from '../helpers/api'
import {
  NCollapse,
  NCollapseItem,
  NEllipsis,
  NH2,
  NText,
  useLoadingBar,
  useMessage,
  useNotification
} from 'naive-ui'
import AppSourceList from '@/components/AppSourceList.vue'
import AppArtplayer from '@/components/AppArtplayer.vue'
import { formatVideoSourceMap } from '@/helpers/app.ts'
import Hls from 'hls.js'
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control'
import AppFooter from '@/components/AppFooter.vue'
import { addHistory, findHistory, updateHistory } from '@/helpers/db.ts'
import { getCurrentSource } from '@/helpers/utils.ts'

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
  height: '180px'
})

const onBeforeMountHandler = () => {
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
  checkUpdateVideo(route.value.params)
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
          auto: 'Auto'
        },
        audio: {
          control: true,
          setting: true,
          getName: (track) => track.name,
          title: 'Audio',
          auto: 'Auto'
        }
      })
    ],
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
      }
    }
  }
}

const getControls = () => {
  return {
    controls: [
      {
        position: 'right',
        html: `<svg style="flex: 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1zm0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1v2zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1z" fill="currentColor"></path></svg>`,
        click: () => {
          artInstance.value.fullscreen = !artInstance.value.fullscreen
        }
      }
    ]
  }
}

const loadVideoSource = (vid, pid) => {
  loadingBar.value!.start()
  httpVideoSource(vid, pid, getCurrentSource(route.value))
    .then((resp) => {
      source.value = resp.data
      if (resp.data.type === 'hls') {
        artOption.value = {
          url: resp.data.url,
          ...getHlsOptions(),
          ...getControls()
        }
      } else {
        artOption.value = {
          url: resp.data.url,
          ...getControls()
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
    if (_findHistory && _findHistory.lastTime && _findHistory.duration - _findHistory.lastTime >= 60) {
      art.seek = _findHistory.lastTime
      message.value.info('跳转到最新进度播放')
    }
    art.play()
  })

  art.on('play', () => {
    console.info('play')
    handlerTimeUpdate()
  })

  // art.on('video:timeupdate', (currentTime) => {
  //   console.log('pppp',currentTime);
  // });
  // art.on('video:durationchange', (duration) => {
  //   console.log('pppp', duration);
  // });
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
      updated_at: Date.now()
    })
  } else {
    await updateHistory(find.id, {
      lastTime: artInstance.value.currentTime,
      updated_at: Date.now()
    })
  }
}

const onBeforeUnmountHandler = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
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
    NCollapse
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
      pid
    }
  }
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
