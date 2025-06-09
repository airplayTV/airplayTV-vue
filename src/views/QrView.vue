<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />

      <div style="padding: 0 10px">
        <div class="flex-row flex-column flex-justify-center flex-align-center">
          <n-image width="320" height="320" :src="qrCodeUrl" :key="qrCodeUrl" class="thumb" />
          <div>
            <n-text>
              房间号：
              <n-ellipsis style="width: 150px">{{ clientId }}</n-ellipsis>
            </n-text>
          </div>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script>
import {defineComponent, onMounted, ref} from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import QRCode from 'qrcode'
import {NEllipsis, NImage, NText} from 'naive-ui'
import {useRoute, useRouter} from 'vue-router'
import {getStorageSync} from '@/helpers/utils'
import {KEY_CLIENT_ID} from '@/helpers/constant'
import AppFooter from '@/components/AppFooter.vue'

const route = ref(null)
const router = ref(null)
const qrCodeUrl = ref(null)
const clientId = ref(null)

const generateQrUrl = () => {
  clientId.value = getStorageSync(KEY_CLIENT_ID)
  const tmpUrl = `${window.location.origin}/join?room_id=${clientId.value}&t=` + Date.now()
  console.log('[tmpUrl]', tmpUrl)
  QRCode.toDataURL(tmpUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/jpeg',
    quality: 0.3,
    width: 300,
  }).then((url) => {
    qrCodeUrl.value = url
  }).catch((err) => {
    console.error(err)
  })
}

const onMountedHandler = () => {
  generateQrUrl()
}

export default defineComponent({
  components: {
    AppFooter,
    NImage,
    NText,
    NEllipsis,
    AppHeader,
  },
  setup() {
    route.value = useRoute()
    router.value = useRouter()

    onMounted(onMountedHandler)
    return {
      qrCodeUrl,
      clientId,
    }
  },
})
</script>
<style scoped>
.thumb {
  border-radius: 4px;
  background-color: #f2f2f2;
}
</style>
