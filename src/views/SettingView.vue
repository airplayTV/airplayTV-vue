<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <!--
    <div class="fixed-qr-reader-content" v-show="showQrReader">
      <div id="qr-reader" class="qr-reader"></div>
    </div>
    -->

    <div>
      <AppHeader :key="pageViewKey" />

      <div style="padding: 0 10px">
        <div class="padding-10px"></div>

        <n-form
            ref="formRef"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
        >
          <n-form-item label="换源：" path="source">
            <div class="flex-row flex-1 xxxx">
              <n-select
                  v-model:value="source"
                  placeholder="切换源"
                  @update:value="onUpdateSource"
                  :options="formattedSourceList"
              />
            </div>
            <div class="padding-10px"></div>
            <div class="flex-row flex-1 xxxx">
              <n-select
                  v-if="formattedTagList"
                  v-model:value="tag"
                  placeholder="选择类型"
                  @update:value="onUpdateTag"
                  :options="formattedTagList"
              />
            </div>
          </n-form-item>

          <n-form-item label="房间：" path="tag" v-if="formattedTagList">
            <n-space justify="space-between" class="flex-1 flex-align-center">
              <div>
                <n-ellipsis v-if="room" style="width: 100px">
                  {{ room }}
                </n-ellipsis>
                <n-text v-else depth="3">扫码加入即可投射视频</n-text>
              </div>
              <n-space>
                <n-button v-if="room" secondary type="warning" @click="showClearRoomId = true">
                  退出
                </n-button>
                <n-button secondary type="primary" @click="startScanning"> 扫码加入</n-button>
              </n-space>
            </n-space>
          </n-form-item>


          <n-form-item label="配置：" path="defaultThumbLayout">
            <div class="flex-row flex-1 ">
              <n-select
                  v-model:value="defaultThumbLayout"
                  placeholder="选择视频封面视图样式"
                  @update:value="onUpdateThumbLayout"
                  :options="thumbLayoutConfig"
                  clearable
              />
            </div>
            <div class="padding-10px"></div>
            <div class="flex-row flex-1 ">
              <n-input v-model:value="sourceSecret" placeholder="请输入兑换码" @keyup="onUpdateSourceSecret" clearable />
            </div>
          </n-form-item>

          <div class="fixed-qr-reader-content" v-show="showQrReader">
            <div id="qr-reader" class="qr-reader"></div>
            <div class="text-align-center padding-10px">
              <n-tag :bordered="false" type="warning" @click="stopScanning">停止扫码</n-tag>
            </div>
          </div>

          <n-form-item label="缓存：" path="source">
            <n-space justify="end" class="flex-1">
              <n-button strong secondary type="warning" @click="showClearHistoryModal = true">
                清空历史
              </n-button>
              <n-button strong secondary type="warning" @click="showClearStorageModal = true">
                清空缓存
              </n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </div>
    </div>

    <AppFooter />

    <n-modal
        v-model:show="showClearHistoryModal"
        preset="dialog"
        title="提示"
        content="确定清空历史数据？"
        positive-text="确认"
        negative-text="关闭"
        @positive-click="onClearVideoHistory"
    />
    <n-modal
        v-model:show="showClearStorageModal"
        preset="dialog"
        title="提示"
        content="确定清空缓存数据？"
        positive-text="确认"
        negative-text="关闭"
        @positive-click="onClearLocalStorage"
    />
    <n-modal
        v-model:show="showClearRoomId"
        preset="dialog"
        title="提示"
        content="确定退出房间？"
        positive-text="确认"
        negative-text="关闭"
        @positive-click="clearRoomId"
    />
    <n-modal v-model:show="showQrResultModal" preset="card" title="提示" style="margin: 0 16px">
      <div>
        解码内容：
        <a :href="qrResult" v-if="isUrl(qrResult)">{{ qrResult }}</a>
        <n-text v-else>{{ qrResult }}</n-text>
      </div>

      <n-space justify="end">
        <n-button strong secondary type="info" @click="copyQrResult"> 复制内容</n-button>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup>
import {defineComponent, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, ref,} from 'vue'
import {
  NButton,
  NDivider,
  NEllipsis,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTag,
  NText,
  useMessage,
} from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import {storeToRefs} from 'pinia'
import {useAppStore} from '@/stores/app'
import {arrayContainsValue, getStorageSync, removeStorageSync, setStorageSync,} from '@/helpers/utils'
import {
  KEY_ROOM_ID,
  KEY_VIDEO_SOURCE,
  KEY_VIDEO_SOURCE_SECRET,
  KEY_VIDEO_TAG,
  KEY_VIDEO_THUMB_LAYOUT
} from '@/helpers/constant'
import {clearHistory} from '@/helpers/db'
import {Html5Qrcode} from 'html5-qrcode'
import copy from 'copy-to-clipboard'
import {useRoute, useRouter} from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'


const route = useRoute()
const router = useRouter()
const message =  useMessage()

const source = ref(null)
const tag = ref(null)
const room = ref(null)
const formattedSourceList = ref(null)
const formattedTagList = ref(null)
const showClearHistoryModal = ref(false)
const showClearStorageModal = ref(false)
const showClearRoomId = ref(false)
const showQrResultModal = ref(false)
const qrResult = ref(null)
const html5QrCode = ref(null)
const showQrReader = ref(false)
const pageViewKey = ref(null)
const appStore = useAppStore()


const sourceSecret = ref(null)
const defaultThumbLayout = ref('cover')
const thumbLayoutConfig = ref([
  { value: 'cover', label: '正常人视图', },
  { value: 'contain', label: '异常人视图', }
])


const onBeforeMountHandler = () => {
  source.value = appStore.source
  tag.value = appStore.tags
  room.value = getStorageSync(KEY_ROOM_ID)

  appStore.setSourceSecret(getStorageSync(KEY_VIDEO_SOURCE_SECRET))
  sourceSecret.value = appStore.sourceSecret

  appStore.setThumbLayout(getStorageSync(KEY_VIDEO_THUMB_LAYOUT))
  defaultThumbLayout.value = appStore.thumbLayout

  formattedSourceList.value = appStore.sourceList?.map((item) => {
    return {
      label: item.name,
      value: item.name,
      data: item,
    }
  })

}

const onBeforeUnmountHandler = () => {
  console.log('[卸载页面监听ws数据]')
  stopScanning()
}

const onMountedHandler = () => {
  handleTagList(source.value)
}

const onBeforeUpdateHandler = () => {
  checkUpdateView()
}

const checkUpdateView = () => {
  const _id = JSON.stringify({ params: route.params, query: route.query })
  if (_id !== pageViewKey.value) {
    pageViewKey.value = _id
  }
}

const handleTagList = (source) => {
  formattedTagList.value = []
  formattedSourceList.value.filter((item) => {
    if (item.value === source) {
      formattedTagList.value = item.data.tags.map((_tag) => {
        return {
          label: _tag.name,
          value: _tag.value,
          data: _tag,
        }
      })

      const findTag = arrayContainsValue(formattedTagList.value, tag.value, (item, v) => {
        return item.value === v
      })
      if (!findTag) {
        setStorageSync(KEY_VIDEO_TAG, formattedTagList.value[0]?.value)
        tag.value = formattedTagList.value[0]?.value
        appStore.setTags(tag.value)
      }
    }
  })
}

const onUpdateSource = (value) => {
  console.log('[onUpdateSource]', value)
  setStorageSync(KEY_VIDEO_SOURCE, value)
  source.value = value
  appStore.setSource(value)

  handleTagList(source.value)
}

const onUpdateThumbLayout = (value) => {
  defaultThumbLayout.value = value
  appStore.setThumbLayout(value)
}

const onUpdateTag = (value) => {
  console.log('[onUpdateTag]', value)
  setStorageSync(KEY_VIDEO_TAG, value)
  appStore.setTags(value)
}

const onUpdateSourceSecret = () => {
  appStore.setSourceSecret(sourceSecret.value)
}

const onClearVideoHistoryHandler = async () => {
  showClearHistoryModal.value = true
}
const onClearLocalStorageHandler = () => {
  showClearStorageModal.value = true
}

const onClearVideoHistory = async () => {
  await clearHistory()
  message.info('历史播放记录已清空')
}
const onClearLocalStorage = () => {
  localStorage.clear()
  message.info('本地缓存数据已清空')
}

const startScanning = () => {
  showQrReader.value = true
  //
  html5QrCode.value = new Html5Qrcode('qr-reader')
  html5QrCode.value.start(
      { facingMode: 'environment' }, // 使用后置摄像头
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        qrResult.value = decodedText // 解析的二维码内容
        stopScanning()
        showQrResultModal.value = true
      },
      (errorMessage) => {
      },
  ).catch((err) => {
    showQrReader.value = false
    message.info(`启动扫码失败：${err}`)
  })
}

const stopScanning = () => {
  showQrReader.value = false
  if (html5QrCode.value) {
    html5QrCode.value.stop().then((ignore) => {
      // alert('扫描停止')
    }).catch((err) => {
      // alert('停止扫描失败:', err)
    })
  }
}

const isUrl = (data) => {
  return typeof data == 'string' && (data.indexOf('http://') === 0 || data.indexOf('https://') === 0)
}

const copyQrResult = () => {
  if (!qrResult.value) {
    message.warning(`没有可复制数据`)
    return
  }
  copy(qrResult.value, {
    debug: true,
    message: 'Press #{key} to copy',
  })
  showQrResultModal.value = false
  message.info(`已复制到粘贴板`)
}

const clearRoomId = () => {
  removeStorageSync(KEY_ROOM_ID)
  room.value = null
  router.replace(`${router.currentRoute.path}?t=${Math.random()}`)
}

onBeforeMount(onBeforeMountHandler)
onBeforeUnmount(onBeforeUnmountHandler)
onMounted(onMountedHandler)
onBeforeUpdate(onBeforeUpdateHandler)

</script>

<style scoped lang="scss">
.fixed-qr-reader-content {
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  .qr-reader {
    width: 100%;
    height: 100%;
  }
}
</style>
