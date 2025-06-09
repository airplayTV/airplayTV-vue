<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 30px 10px">
        <n-text v-if="tmpRoom" style="line-height: 180%">
          <div>加入房间：{{ tmpRoom }}</div>
          <n-text depth="3">即将跳转到首页...</n-text>
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

const route = ref(null)
const router = ref(null)
const tmpRoom = ref(null)

const onBeforeMountHandler = () => {
  tmpRoom.value = route.value.query['room_id']
  if (tmpRoom.value) {
    setStorageSync(KEY_ROOM_ID, tmpRoom.value)
    setTimeout(() => {
      router.value.push('/?from-join-room')
    }, 2000)
  }
}

export default defineComponent({
  components: { AppHeader, AppFooter, NText },
  setup() {
    route.value = useRoute()
    router.value = useRouter()

    onBeforeMount(onBeforeMountHandler)

    return {
      tmpRoom,
    }
  },
})
</script>
