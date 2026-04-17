<template>
  <div>

    <div v-if="room" style="margin-top: 8px">
      <n-alert type="warning" :show-icon="false">
        <n-text depth="2">
          房间：
          <n-ellipsis style="max-width: 150px">{{ room }}</n-ellipsis>
          <n-text depth="3">点击播放即投射</n-text>
        </n-text>
      </n-alert>
    </div>

    <div>
      <div class="flex-row flex-justify-between flex-align-center">
        <n-h5>播放列表</n-h5>
        <div v-if="!isMp3" class="color-grey font-size-12px">
          快捷键：上一集(p)，下一集(n)，全屏切换(f)
        </div>
      </div>
      <div class="padding-5px"></div>

      <div class="flex-column links" style="gap: 8px 12px">
        <div class="source-item flex-row">
          <div class="idx text-align-center">#</div>
          <div class="title">
            <text v-if="isMp3">歌曲</text>
            <text v-else>选集</text>
          </div>
          <div class="artist">
            <text v-if="isMp3">歌手</text>
            <text v-else>来源</text>
          </div>
          <div class="op text-align-center">##</div>

        </div>
        <div v-for="(item, idx) in sourceList" :key="idx" class="source-item flex-row"
             :class="{'active':playIndex===idx}">
          <div class="idx text-align-center">{{ idx + 1 }}</div>
          <div class="title text-ellipsis">
            <n-text class="bottom-dashed" @click="onOpenVideoPlay(idx, item)">
              {{ item.title || 'Untitled' }}
            </n-text>
          </div>
          <div class="artist text-ellipsis color-grey">{{ item.artist || 'Unknown' }}</div>
          <div class="op text-align-center flex-row flex-justify-center flex-align-center">
            <n-icon size="26" color="#666666" class="cursor-pointer" @click="onOpenVideoPlay(idx, item)">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32">
                <g fill="none">
                  <path
                      d="M11.24 6.203A1.5 1.5 0 0 0 9 7.508V24.5a1.5 1.5 0 0 0 2.24 1.305l14.997-8.498a1.5 1.5 0 0 0 0-2.61L11.239 6.202zM7 7.508c0-2.681 2.891-4.367 5.225-3.046l14.997 8.493c2.367 1.34 2.368 4.75.001 6.09l-14.997 8.5C9.892 28.865 7 27.18 7 24.498V7.51z"
                      fill="currentColor"></path>
                </g>
              </svg>
            </n-icon>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onBeforeMount, ref, watch} from 'vue'
import {NAlert, NEllipsis, NH5, NIcon, NText, useMessage,} from 'naive-ui'
import {useRoute, useRouter} from 'vue-router'
import {getStorageSync} from '../helpers/utils'
import {KEY_CLIENT_ID, KEY_ROOM_ID} from '../helpers/constant'
import {ControlEventLoadVideo, sendControl} from '@/helpers/websocket'
import {useAppStore} from "@/stores/app.js";

const video = ref(null)
const route = useRoute()
const router = useRouter()
const message = useMessage()

const room = ref(null)
const clientId = ref(null)
const appStore = useAppStore()

const props = defineProps(['sourceList', 'vid', 'pid', 'playIndex', 'isMp3'])
const emits = defineEmits(['changed'])


watch(() => props.playIndex, (newVal, oldVal) => {
  // console.log('[watch.music]', { newVal, oldVal })
})

const onOpenVideoPlay = (idx, source) => {
  if (room.value) {
    let tmpSource = appStore.source, tmpVid = props.vid, tmpPid = source.id;
    // 投射播放
    sendControl(room.value, {
      event: ControlEventLoadVideo,
      group: room.value,
      vid: tmpVid,
      pid: tmpPid,
      // name: source.name,
      source: tmpSource,
      mode: appStore.sourceSecret,
    })
    // message.value.info('已发送投射播放请求')
    router.push('/control')
  } else {
    emits('changed', idx, source)
  }
}

const onBeforeMountHandler = () => {
  room.value = getStorageSync(KEY_ROOM_ID)
  clientId.value = getStorageSync(KEY_CLIENT_ID)
}

onBeforeMount(onBeforeMountHandler)

</script>

<style scoped lang="scss">
.n-h5 {
  margin: 10px 0 4px 0;
}

.bottom-dashed {
  border-bottom: 1px dashed #50555b;
  cursor: pointer;
}

.source-item {
  line-height: 70px;

  .idx {
    width: 70px;
    font-weight: bold;
  }

  .title {
    flex: 1;
    padding: 0 12px;
  }

  .song {

  }

  .artist {
    padding: 0 12px;
    max-width: 180px;
  }

  .op {
    width: 80px;
  }

  .active {
    background-color: #18a058;
    color: #ffffff;
  }

  .n-tag {
    min-width: 50px;
    display: flex;
    justify-content: center;
  }

  ::v-deep(.router-link-active) {
    border-bottom: unset !important;
  }

  .xx-uu {
    padding: 6px;
  }
}

.source-item.active {
  background-color: rgba(29, 185, 84, 0.1) !important;
}

.source-item:hover {
  background-color: #f5f5f5 !important;
}

.source-item:nth-child(odd) {
  background-color: #fafafa;
}


@media (min-width: 0px) and (max-width: 600px) {
  .idx {
    width: 50px !important;
  }
  .artist {
    padding: 0 12px;
    max-width: 80px !important;
  }
  .op {
    width: 50px !important;
  }
}

@media (min-width: 600px) and (max-width: 900px) {
}

</style>
