<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 30px 10px">
        <n-text v-if="tmpRoom" style="line-height: 180%">
          <div>加入房间：{{ tmpRoom }}</div>
          <n-text v-if="errorMessage" depth="3">{{ errorMessage }}</n-text>
          <n-text v-else depth="3">正在连接电视...</n-text>
        </n-text>
        <n-text v-else depth="3">没有可加入的房间</n-text>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script>
import {defineComponent, onBeforeMount, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {setStorageSync} from '@/helpers/utils'
import {KEY_ROOM_ID} from '@/helpers/constant'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import {NText} from 'naive-ui'
import {controllerPresence} from '@/helpers/controller-presence'
import {ControllerOfflineMessage} from '@/helpers/websocket-ack'

const route = ref(null)
const router = ref(null)
const tmpRoom = ref(null)
const errorMessage = ref('')

const onBeforeMountHandler = async () => {
  tmpRoom.value = route.value.query['room_id']
  if (tmpRoom.value) {
    setStorageSync(KEY_ROOM_ID, tmpRoom.value)
    try {
      await controllerPresence.start(tmpRoom.value)
      await router.value.push('/?from-join-room')
    } catch (error) {
      errorMessage.value = ControllerOfflineMessage
    }
  }
}

export default defineComponent({
  components: { AppHeader, AppFooter, NText },
  setup() {
    route.value = useRoute()
    router.value = useRouter()

    onBeforeMount(() => {
      void onBeforeMountHandler().catch(() => {
        errorMessage.value = ControllerOfflineMessage
        console.warn('[controller-presence] failed')
      })
    })

    return {
      tmpRoom,
      errorMessage,
    }
  },
})
</script>
