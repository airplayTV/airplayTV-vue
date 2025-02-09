<template>
  <div>
    <AppHeader />

    <div style="padding: 0 10px" v-if="video">
      <n-h2 class="text-align-center">{{ video.name }}</n-h2>

      <!--<video :src="video.url" style="width: 100%" />-->
      <div style="border-radius: 4px; display: flex; min-height: 180px">
        <AppArtplayer @get-instance="getArtInstance" :option="artOption" :style="artStyle" />
      </div>

      <div style="margin: 10px 0; color: dimgray">
        <n-text v-if="source">{{ source.url }}</n-text>
      </div>

      <n-collapse accordion default-expanded-names="1">
        <n-collapse-item title="选集" name="1">
          <AppSourceList v-if="video" :vid="video.id" :source-list="videoSourceList" />
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
import { NCollapse, NCollapseItem, NH2, NText, useLoadingBar } from 'naive-ui'
import AppSourceList from '@/components/AppSourceList.vue'
import AppArtplayer from '@/components/AppArtplayer.vue'
import { formatVideoSourceMap } from '@/helpers/app.ts'
import Hls from 'hls.js'
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control'
import AppFooter from "@/components/AppFooter.vue";

const timer = ref(null)
const updateCount = ref(0)
const route = ref(null)
const loadingBar = ref(null)
const tmpQuery = ref(null)

const source = ref(null)
const video = ref(null)
const artRef = ref(null)
const artInstance = ref({})
const artOption = ref({})
const artStyle = ref({
  width: '100%',
  height: '180px',
})

const onBeforeMountHandler = () => {
  console.log('[]', route.value.params)
  // loadVideoSource(route.value.params.vid, route.value.params.pid)
  // loadVideo(route.value.params.vid)
  checkUpdateVideo(route.value.params)
}

const checkUpdateVideo = (params) => {
  // tmpQuery
  const v = JSON.stringify(params)
  console.log('[checkUpdateVideo]', tmpQuery.value, v)
  if (v != tmpQuery.value) {
    tmpQuery.value = v

    video.value = null
    source.value = null

    loadVideoSource(route.value.params.vid, route.value.params.pid)
    loadVideo(route.value.params.vid)
  }
}

const onMountedHandler = () => {
  console.log('[onMountedHandler]', route.value.params)

  artStyle.value.height = `${computePlayerHeight()}px`
  window.onresize = () => {
    artStyle.value.height = `${computePlayerHeight()}px`
  }
}

const onBeforeUpdateHandler = () => {
  console.log('[onBeforeUpdateHandler]', updateCount.value)
  checkUpdateVideo(route.value.params)

}
const onUpdatedHandler = () => {
  console.log('[onUpdatedHandler]', route.value.params)
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
        html: `<svg style="color: white" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1zm0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1zm11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1v2zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1z" fill="currentColor"></path></svg>`,
        click: () => {
          artInstance.value.fullscreen = !artInstance.value.fullscreen
        },
      },
    ],
  }
}

const loadVideoSource = (vid, pid) => {
  loadingBar.value!.start()
  httpVideoSource(vid, pid)
    .then((resp) => {
      console.log('[respSouece]', resp)
      source.value = resp.data
      console.log('[resp.data.type]', resp.data.type)
      if (resp.data.type === 'hls') {
        artOption.value = {
          url: resp.data.url,
          ...getHlsOptions(),
          ...getControls(),
        }
      } else {
        artOption.value = {
          url: resp.data.url,
          ...getControls(),
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
  httpVideo(vid)
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
  art.on('ready', () => {
    art.play();
  });

  art.on('play', () => {
    console.info('play');
    handlerTimeUpdate()
  });


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
    console.log('[Intval]', artInstance.value.currentTime, artInstance.value.duration)
  }, 5000)
}


const onBeforeUnmountHandler = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
}

export default defineComponent({
  components: {
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
