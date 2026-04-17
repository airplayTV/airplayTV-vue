<template>

  <div style="">
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

        <div class="split" style="width: 20px ; height: 100%"></div>

        <div class="lrc flex-1 flex-column" style="width: 0;">
          <n-h2>{{ video.name || 'Untitled' }}</n-h2>

          <div class="width-100 line-height-50px flex-1">
            <div>{{ video.actors || 'Unknown' }}</div>
            <div class="flex-row cursor-pointer">
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
          <div>
            地址：
            <n-text class="source-url bottom-dashed cursor-pointer" @click="onWindowOpen(source.url)">
              {{ source.url }}
            </n-text>
          </div>

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

    <AppAudioVideoList
        v-if="video"
        :vid="video.id"
        :play-index="playIndex"
        :source-list="playList"
        :is-mp3="true"
        @changed="onAudioListChange" />

  </div>

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


</template>

<script setup>

import {
  NButton,
  NForm,
  NFormItem,
  NH2,
  NIcon,
  NImage,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NText,
  useMessage
} from "naive-ui";
import {
  FavoriteBorderFilled,
  FavoriteFilled,
  PauseCircleOutlineOutlined,
  PlayCircleFilledWhiteOutlined
} from "@vicons/material";
import AppAudioVideoList from "@/components/AppAudioVideoList.vue";
import AudioPlayer from "@/components/AudioPlayer.vue";
import {httpCollectAdd, httpVideoSource} from "@/helpers/api.js";
import {onBeforeMount, ref} from "vue";
import {useAppStore} from "@/stores/app.js";
import {addHistoryWarp, addTimelineWarp, findSourceLink, handlerPlayList} from "@/helpers/play.js";
import {useRoute, useRouter} from "vue-router";

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const props = defineProps(['video'])

const video = ref({})
const source = ref({})

const apInstance = ref(null)
const playList = ref({})
const playIndex = ref(0)

const showCollectModal = ref(false)

const formCollect = ref({
  user: null,// 用户
  name: null// 收藏夹名称
})

const collectOptions = [
  { label: '默认收藏', value: '默认收藏' },
  { label: '私藏集合', value: '私藏集合' },
]

const _pageKey = '_key_app_page_video_play_'


const onEmptyEvent = (ctx) => {
  console.log('[onEmptyEvent]', ctx)
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
      if (ctx.timeStamp > 5000 && parseInt(ctx.timeStamp / 1000) % 3 === 0) {
        addHistoryWarp(ctx, appStore.source, { ...video.value, id: props.video.id }, {
          ...source.value,
          id: playList.value[playIndex.value].id
        })
        addTimelineWarp(ctx, appStore.source, { ...video.value, id: props.video.id }, {
          ...source.value,
          id: playList.value[playIndex.value].id
        })
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
    id: ctx.id,
    name: ctx.title,
    thumb: ctx.pic,
    actors: ctx.actors,
  })
  source.value = Object.assign({}, source.value, {
    url: ctx.src
  })

  router.replace({ path: route.path, query: { ...route.query, pid: ctx.id || '' } })
}

const onAudioListChange = (idx, ctx) => {
  playIndex.value = idx

  let tmpVideo = playList.value[idx] || {}
  router.replace({ path: route.path, query: { ...route.query, pid: tmpVideo.id || '' } })
}

const onAudioTimeUpdate = (ctx) => {
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


const tryHandlerVideoSource = async (vid, pid, _m3u8p = false) => {
  let respSource;
  try {
    respSource = await httpVideoSource(vid, pid, appStore.source, _m3u8p)
  } catch (e) {
    console.error('[httpVideoSource.Error]', e)
  }
  if (!respSource) {
    return console.log('[视频加载失败]')
  }

  source.value = respSource.data

  console.log('[获取到播放信息]', Object.assign({}, respSource.data, { url: respSource.data.url }))

  const findLink = findSourceLink(props.video.links, pid)
  video.value = { ...video.value, name: findLink.name }
  playIndex.value = findLink._idx || 0
  playList.value = handlerPlayList(props.video.links, props.video, source.value, appStore.source)
}


const onBeforeMountHandler = () => {
  // console.log('[接收到音乐信息]', JSON.parse(JSON.stringify(props.video)))
  tryHandlerVideoSource(props.video.id, route.query.pid ? route.query.pid : props.video.links[0].id)
}

const onWindowOpen = (url, target = '_blank') => {
  window.open(url, target)
}

onBeforeMount(onBeforeMountHandler)

</script>

<style scoped>
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
    width: 300px;
    height: 300px;
    border-radius: 10px;
    background-color: #faf9f9;
  }

  .thumb-container {
    width: 300px;
    height: 300px;
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
    min-width: 350px;
    padding: 10px 10px;
    line-height: 180%;
    color: rgb(118, 124, 130);
  }

  .lrc-scroller {
    max-height: 444px !important;
    line-height: 200%;
  }

  .line-height-50px {
    line-height: 50px;
  }

  .source-url {
    border-bottom: 1px dashed rgb(118, 124, 130);
  }

}

@media (min-width: 0px) and (max-width: 600px) {
  .audio-container {
    //min-height: 280px !important;
  }

  .side {
    min-width: 100%;
    padding: 20px 0 10px 0;
    justify-content: center;
  }

  .split {
    display: none;
  }

  .lrc {
    padding: 10px 0 !important;
  }
}

@media (min-width: 600px) and (max-width: 900px) {
  .audio-container {
    //min-height: 320px !important;
  }

  .side {
    min-width: 100%;
    padding: 20px 0 10px 0;
    justify-content: center;
  }

  .split {
    display: none;
  }

  .lrc {
    padding: 10px 0 !important;
  }
}

@media (min-width: 900px) and (max-width: 9000px) {
  .audio-container {
    //min-height: 520px !important;
    //padding-top: 20px;
  }

  .side {
    //min-width: 400px;
  }

}

</style>