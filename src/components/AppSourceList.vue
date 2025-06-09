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

    <div v-for="(source, idx) in sourceList" :key="idx">
      <n-h5>
        <n-text>
          {{ idx }}
        </n-text>
      </n-h5>

      <div class="flex-row" style="gap: 8px 12px">
        <div v-for="(item, idx) in source" :key="idx" class="source-item">
          <n-tag
              :type="pid === item.id ? 'info' : ''"
              :bordered="false"
              @click="onOpenVideoPlay(vid, item)"
          >
            <div class="xx-uu" style="display: flex; align-items: center">
              {{ item.name }}
              <n-icon v-if="room" size="18" color="#0e7a0d" style="margin-left: 5px">
                <CastRound />
              </n-icon>
            </div>
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent, onBeforeMount, ref} from 'vue'
import {
  NAlert,
  NButton,
  NEllipsis,
  NGi,
  NGrid,
  NGridItem,
  NH1,
  NH2,
  NH3,
  NH4,
  NH5,
  NIcon,
  NImage,
  NInput,
  NInputGroup,
  NPagination,
  NSelect,
  NTag,
  NText,
  useMessage,
} from 'naive-ui'
import {BrokenImageRound, CastRound} from '@vicons/material'
import {useRoute, useRouter} from 'vue-router'
import {getCurrentSource, getStorageSync} from '../helpers/utils'
import {KEY_CLIENT_ID, KEY_ROOM_ID} from '../helpers/constant'
import {ControlEventLoadVideo, sendControl} from '@/helpers/websocket'

const video = ref(null)
const route = ref(null)
const router = ref(null)
const room = ref(null)
const clientId = ref(null)
const message = ref(null)

const onOpenVideoPlay = (vid, source) => {
  if (!room.value) {
    router.value.push(`/video/play/${vid}/${source.id}?_source=${getCurrentSource(route.value)}`)
  } else {
    // 投射播放
    sendControl(room.value, {
      event: ControlEventLoadVideo,
      group: room.value,
      vid: vid,
      pid: source.id,
      // name: source.name,
      source: getCurrentSource(route.value),
    })
    // message.value.info('已发送投射播放请求')
    router.value.push('/control')
  }
}

const onBeforeMountHandler = () => {
  room.value = getStorageSync(KEY_ROOM_ID)
  clientId.value = getStorageSync(KEY_CLIENT_ID)
}

export default defineComponent({
  components: {
    NSelect,
    NInputGroup,
    NInput,
    NButton,
    NIcon,
    NGrid,
    NGi,
    NImage,
    NEllipsis,
    NH1,
    NH2,
    NPagination,
    NTag,
    NH3,
    NH4,
    NH5,
    NGridItem,
    NText,
    NAlert,
    BrokenImageRound,
    CastRound,
  },
  props: ['sourceList', 'vid', 'pid'],
  setup() {
    route.value = useRoute()
    router.value = useRouter()
    message.value = useMessage()

    onBeforeMount(onBeforeMountHandler)

    return {
      video,
      onOpenVideoPlay,
      room,
    }
  },
})
</script>

<style scoped lang="scss">
.n-h5 {
  margin: 10px 0 4px 0;
}

.source-item {
  //margin-right: 10px;

  .active {
    background-color: #18a058;
    color: #ffffff;
  }

  .n-tag {
    min-width: 50px;
    display: flex;
    justify-content: center;
  }
}
</style>
