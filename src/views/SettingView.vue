<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <!--
    <div class="fixed-qr-reader-content" v-show="showQrReader">
      <div id="qr-reader" class="qr-reader"></div>
    </div>
    -->

    <div>
      <AppHeader :key="pageViewKey" />

      <main class="settings-page">
        <div class="padding-10px"></div>

        <n-form
            ref="formRef"
            class="settings-form"
            label-placement="left"
            :label-width="96"
            require-mark-placement="right-hanging"
        >
          <section class="settings-section" aria-labelledby="content-room-title">
            <div class="settings-section-heading">
              <div>
                <h2 id="content-room-title">内容与房间</h2>
                <p>选择内容来源，并连接用于投屏的房间</p>
              </div>
            </div>
            <div class="settings-card">
              <n-form-item label="换源：" path="source">
                <div class="field-stack source-select-grid">
                  <n-select
                      v-model:value="source"
                      placeholder="切换源"
                      @update:value="onUpdateSource"
                      :options="formattedSourceList"
                      filterable
                      clearable
                  />
                  <n-select
                      v-if="formattedTagList"
                      v-model:value="tag"
                      placeholder="选择类型"
                      @update:value="onUpdateTag"
                      :options="formattedTagList"
                      filterable
                      clearable
                  />
                </div>
              </n-form-item>

              <n-form-item label="房间：" path="tag" v-if="formattedTagList">
                <div class="room-row">
                  <div class="room-status">
                    <n-ellipsis v-if="room" class="room-id">
                      {{ room }}
                    </n-ellipsis>
                    <n-text v-else depth="3">扫码加入即可投射视频</n-text>
                  </div>
                  <div class="room-actions">
                    <n-button v-if="room" secondary type="warning" @click="showClearRoomId = true">
                      退出
                    </n-button>
                    <n-button secondary type="primary" @click="startScanning">扫码加入</n-button>
                  </div>
                </div>
              </n-form-item>
            </div>
          </section>

          <section class="settings-section" aria-labelledby="playback-title">
            <div class="settings-section-heading">
              <div>
                <h2 id="playback-title">播放偏好</h2>
                <p>调整界面、播放器与账号同步选项</p>
              </div>
            </div>
            <div class="settings-card">
              <n-form-item label="配置：" path="defaultStyle">
                <div class="field-stack">
                  <n-select
                      v-model:value="defaultStyle"
                      placeholder="选择样式风格"
                      @update:value="onUpdateStyleConfig"
                      :options="styleConfig"
                      clearable
                  />
                  <n-input
                      v-model:value="sourceSecret"
                      placeholder="请输入兑换码，解锁更多资源"
                      @keyup="onUpdateSourceSecret"
                      @clear="onUpdateSourceSecret(true)" clearable />
                </div>
              </n-form-item>

              <n-form-item label="播放器：" path="player">
                <n-select
                    v-model:value="player"
                    placeholder="选择视频播放器"
                    aria-label="视频播放器"
                    @update:value="onUpdatePlayer"
                    :options="playerOptions"
                />
              </n-form-item>

              <n-form-item label="账号：" path="defaultStyle">
                <n-input
                    v-model:value="appUsername"
                    placeholder="请输入账号，可同步收藏夹"
                    @keyup="onUpdateAppUsername"
                    @clear="onUpdateAppUsername(true)" clearable />
              </n-form-item>

              <div class="settings-notice" role="note">
                <span class="settings-notice-dot" aria-hidden="true"></span>
                修改配置后刷新页面生效
              </div>
            </div>
          </section>

          <section class="settings-section" aria-labelledby="data-tools-title">
            <div class="settings-section-heading">
              <div>
                <h2 id="data-tools-title">数据与工具</h2>
                <p>维护本地数据并进入管理功能</p>
              </div>
            </div>
            <div class="settings-card">
              <n-form-item label="缓存：" path="source">
                <div class="tool-actions">
                  <n-button strong secondary type="warning" @click="showClearHistoryModal = true">
                    清空历史
                  </n-button>
                  <n-button strong secondary type="warning" @click="showClearStorageModal = true">
                    清空缓存
                  </n-button>
                </div>
              </n-form-item>

              <n-form-item label="管理工具：" path="source">
                <div class="tool-actions">
                  <n-button
                      strong secondary type="warning"
                      @click="router.push('/source-stat')">
                    监测
                  </n-button>
                  <n-button
                      strong secondary
                      :type="adReviewStore.authenticated ? 'success' : 'primary'"
                      @click="openAdReviewMode">
                    <template #icon><n-icon><shield-lock /></n-icon></template>
                    <span v-if="adReviewStore.authenticated" class="review-mode-label">
                      <span class="review-mode-dot" aria-hidden="true"></span>广告标记模式已开启
                    </span>
                    <span v-else>广告标记模式</span>
                  </n-button>
                </div>
              </n-form-item>
            </div>
          </section>

          <div class="fixed-qr-reader-content" v-show="showQrReader">
            <div id="qr-reader" class="qr-reader"></div>
            <div class="text-align-center padding-10px">
              <n-tag :bordered="false" type="warning" @click="stopScanning">停止扫码</n-tag>
            </div>
          </div>
        </n-form>
      </main>
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
    <AdReviewLoginModal v-model:show="showAdReviewLogin" @success="onAdReviewLogin" />
  </div>
</template>

<script setup>
import {onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, ref,} from 'vue'
import {NButton, NEllipsis, NForm, NFormItem, NIcon, NInput, NModal, NSelect, NSpace, NTag, NText, useMessage,} from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import {useAppStore} from '@/stores/app'
import {arrayContainsValue, getStorageSync, removeStorageSync, setStorageSync,} from '@/helpers/utils'
import {
  KEY_APP_USERNAME,
  KEY_ROOM_ID,
  KEY_VIDEO_PLAYER,
  KEY_VIDEO_SOURCE,
  KEY_VIDEO_SOURCE_SECRET,
  KEY_VIDEO_STYLE_CONFIG,
  KEY_VIDEO_TAG
} from '@/helpers/constant'
import {clearHistory, clearTimeline} from '@/helpers/db'
import {Html5Qrcode} from 'html5-qrcode'
import copy from 'copy-to-clipboard'
import {useRoute, useRouter} from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import AdReviewLoginModal from '@/components/ad-review/AdReviewLoginModal.vue'
import ShieldLock from '@vicons/tabler/ShieldLock'
import {useAdReviewStore} from '@/stores/ad-review.js'
import {playTypeOption} from '@/helpers/play.js'
import {resolvePlayerPreference} from '@/helpers/player-preference.js'
import {formatVideoSourceOptions} from '@/helpers/video-source-options.js'


const route = useRoute()
const router = useRouter()
const message = useMessage()
const showAdReviewLogin = ref(false)
const adReviewStore = useAdReviewStore()

const openAdReviewMode = async () => {
  if (adReviewStore.authenticated || await adReviewStore.restore()) {
    await router.push({ name: 'AdReviewHistory' })
    return
  }
  showAdReviewLogin.value = true
}

const onAdReviewLogin = () => {
  message.success('广告标记模式已开启')
  router.push({ name: 'AdReviewHistory' })
}

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
const appUsername = ref(null)
const defaultStyle = ref(0)
const player = ref(playTypeOption.dp)
const playerOptions = Object.freeze([
  {value: playTypeOption.dp, label: 'DPlayer（默认）'},
  {value: playTypeOption.art, label: 'ArtPlayer'},
  {value: playTypeOption.libmedia, label: 'Libmedia AVPlayer'},
])
const styleConfig = ref([
  { value: 0, label: '正常人视图', },
  { value: 1, label: '异常人视图', }
])


const onBeforeMountHandler = () => {
  source.value = appStore.source
  tag.value = appStore.tags
  room.value = getStorageSync(KEY_ROOM_ID)
  player.value = resolvePlayerPreference(getStorageSync(KEY_VIDEO_PLAYER))

  appStore.setSourceSecret(getStorageSync(KEY_VIDEO_SOURCE_SECRET))
  sourceSecret.value = appStore.sourceSecret

  appStore.setUsername(getStorageSync(KEY_APP_USERNAME))
  appUsername.value = appStore.username

  appStore.setStyleConfig(getStorageSync(KEY_VIDEO_STYLE_CONFIG))
  defaultStyle.value = appStore.styleConfig

  formattedSourceList.value = formatVideoSourceOptions(appStore.sourceList)

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
      formattedTagList.value = item.data.tags.map((_tag, idx) => {
        return {
          label: `(${idx + 1}) ${_tag.name}`,
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

const onUpdateStyleConfig = (value) => {
  defaultStyle.value = value
  appStore.setStyleConfig(value)
}

const onUpdatePlayer = (value) => {
  player.value = resolvePlayerPreference(value)
  setStorageSync(KEY_VIDEO_PLAYER, player.value)
}

const onUpdateTag = (value) => {
  console.log('[onUpdateTag]', value)
  setStorageSync(KEY_VIDEO_TAG, value)
  appStore.setTags(value)
}

const onUpdateSourceSecret = (clear) => {
  if (clear === true) {
    sourceSecret.value = ''
  }
  appStore.setSourceSecret(sourceSecret.value)
}

const onUpdateAppUsername = (clear) => {
  if (clear === true) {
    appUsername.value = ''
  }
  appStore.setUsername(appUsername.value)
}

const onClearVideoHistoryHandler = async () => {
  showClearHistoryModal.value = true
}
const onClearLocalStorageHandler = () => {
  showClearStorageModal.value = true
}

const onClearVideoHistory = async () => {
  await clearHistory()
  await clearTimeline()
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
  router.replace(`${route.path}?t=${Math.random()}`)
}

onBeforeMount(onBeforeMountHandler)
onBeforeUnmount(onBeforeUnmountHandler)
onMounted(onMountedHandler)
onBeforeUpdate(onBeforeUpdateHandler)

</script>

<style scoped lang="scss">
.settings-page {
  box-sizing: border-box;
  padding: 0 10px;
}

.settings-section + .settings-section {
  margin-top: 24px;
}

.settings-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin: 0 4px 10px;

  h2 {
    margin: 0;
    color: var(--color-heading, #1f2329);
    font-size: 17px;
    font-weight: 650;
    line-height: 1.4;
  }

  p {
    margin: 2px 0 0;
    color: var(--color-text, #4b5563);
    opacity: .58;
    font-size: 13px;
    line-height: 1.5;
  }
}

.settings-card {
  padding: 20px 20px 4px;
  overflow: hidden;
  background: var(--color-background-soft, #fff);
  border: 1px solid var(--color-border, #e8ecea);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(31, 35, 48, .045);
}

.settings-form :deep(.n-form-item-label) {
  justify-content: flex-start;
  padding-right: 16px;
  color: var(--color-heading, #1f2329);
  font-weight: 600;
}

.settings-form :deep(.n-form-item-blank) {
  min-width: 0;
}

.field-stack {
  display: grid;
  width: 100%;
  gap: 10px;
}

.source-select-grid {
  grid-template-columns: minmax(0, 3fr) minmax(220px, 2fr);
}

.room-row {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.room-status {
  min-width: 0;
}

.room-id {
  max-width: 220px;
}

.room-actions {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: 10px;

  .n-button {
    min-height: 44px;
  }
}

.settings-notice {
  display: flex;
  min-height: 40px;
  margin: -2px 0 16px 96px;
  padding: 9px 12px;
  align-items: center;
  gap: 9px;
  color: var(--color-text, #4b5563);
  background: rgba(24, 160, 88, .07);
  border: 1px solid rgba(24, 160, 88, .15);
  border-radius: 9px;
  font-size: 13px;
}

.settings-notice-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  background: #18a058;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(24, 160, 88, .1);
}

.tool-actions {
  display: grid;
  width: 100%;
  grid-template-columns: 112px 196px;
  justify-content: end;
  gap: 10px;

  .n-button {
    min-height: 44px;
  }
}

.review-mode-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.review-mode-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px rgba(24, 160, 88, .12);
}

@media (max-width: 640px) {
  .source-select-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .settings-card {
    padding: 16px 14px 2px;
    border-radius: 12px;
  }

  .settings-section-heading {
    margin-inline: 2px;
  }

  .room-row {
    align-items: stretch;
    flex-direction: column;
  }

  .room-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));

    .n-button {
      width: 100%;
    }
  }

  .settings-notice {
    margin-left: 96px;
  }

  .tool-actions {
    grid-template-columns: 1fr;
    justify-content: stretch;

    .n-button {
      width: 100%;
    }
  }
}

@media (max-width: 390px) {
  .settings-form :deep(.n-form-item-label) {
    padding-right: 10px;
  }

  .settings-notice {
    margin-left: 0;
  }
}

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
