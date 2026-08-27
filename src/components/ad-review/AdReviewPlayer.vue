<template>
  <section class="preview-card" aria-label="分段视频预览">
    <div class="preview-header">
      <div>
        <span class="eyebrow">片段预览</span>
        <strong v-if="block">第 {{ block.blockIndex + 1 }} 段 · {{ timeRange }}</strong>
        <small v-if="block">{{ previewMode === 'direct' ? '原地址直连' : '兼容代理模式' }}</small>
      </div>
      <n-select v-model:value="segmentCount" :options="countOptions" size="small" aria-label="预览片段数量" />
    </div>
    <div class="video-frame">
      <video ref="videoRef" controls playsinline preload="metadata" @error="onNativePlaybackError" />
      <div v-if="!block" class="empty-player">选择左侧分段开始预览</div>
    </div>
    <div v-if="previewError" class="preview-error" role="alert">
      <span>{{ previewError }}</span>
      <n-button v-if="fallbackMode" size="small" secondary type="warning" @click="switchToFallback">切换兼容模式</n-button>
    </div>
    <p class="preview-help">默认播放本段第一个有效媒体片段；需要更多上下文时可切换为 3、5 或 10 个。</p>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { NButton, NSelect } from 'naive-ui'
import Hls from 'hls.js'
import { adReviewAPI } from '@/helpers/ad-review-api.js'
import { adReviewPreviewFallbackMode } from '@/helpers/ad-review-history.js'
import { formatApproxTime } from '@/helpers/ad-review-state.js'

const props = defineProps({ snapshotId: Number, block: Object })
const videoRef = ref(null)
const segmentCount = ref(1)
const previewMode = ref('direct')
const previewError = ref('')
let hls = null
const countOptions = [1, 3, 5, 10].map((value) => ({ label: `${value} 个片段`, value }))
const timeRange = computed(() => `${formatApproxTime(props.block?.startMs)}–${formatApproxTime(props.block?.endMs)}`)
const fallbackMode = computed(() => previewError.value ? adReviewPreviewFallbackMode(previewMode.value) : null)

const destroyPlayer = () => {
  hls?.destroy()
  hls = null
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.removeAttribute('src')
    videoRef.value.load()
  }
}

const load = () => {
  destroyPlayer()
  if (!videoRef.value || !props.snapshotId || !props.block?.id) return
  previewError.value = ''
  const url = adReviewAPI.previewURL(props.snapshotId, props.block.id, segmentCount.value, previewMode.value)
  if (Hls.isSupported()) {
    hls = new Hls()
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) showPlaybackError()
    })
    hls.loadSource(url)
    hls.attachMedia(videoRef.value)
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoRef.value.src = url
  }
}

const showPlaybackError = () => {
  previewError.value = previewMode.value === 'direct'
    ? '原地址直连播放失败，可切换到兼容代理模式重试。'
    : '兼容代理模式播放失败。'
}

const onNativePlaybackError = () => {
  if (videoRef.value?.currentSrc) showPlaybackError()
}

const switchToFallback = () => {
  if (!fallbackMode.value) return
  previewMode.value = fallbackMode.value
  load()
}

watch([() => props.snapshotId, () => props.block?.id], () => {
  previewMode.value = 'direct'
  previewError.value = ''
  load()
}, { flush: 'post' })
watch(segmentCount, load, { flush: 'post' })
onBeforeUnmount(destroyPlayer)
</script>

<style scoped>
.preview-card { background: var(--review-panel); border: 1px solid var(--review-border); border-radius: var(--review-radius); overflow: hidden; box-shadow: var(--review-shadow); }
.preview-header { min-height: 68px; padding: 12px 16px; border-bottom: 1px solid var(--review-border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.preview-header > div { display: grid; gap: 3px; }
.preview-header strong { font-size: 16px; font-variant-numeric: tabular-nums; }
.preview-header small { color: var(--review-muted); }
.preview-header .n-select { width: 126px; }
.eyebrow { color: var(--review-muted); font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.video-frame { position: relative; aspect-ratio: 16 / 9; background: #0b0f14; }
video { width: 100%; height: 100%; display: block; background: #0b0f14; }
.empty-player { position: absolute; inset: 0; display: grid; place-items: center; color: #a7b0bd; }
.preview-error { min-height: 44px; padding: 8px 12px; border-top: 1px solid var(--review-danger-border); background: var(--review-danger-soft); color: var(--review-danger-text); display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; }
.preview-help { margin: 0; padding: 11px 16px 13px; border-top: 1px solid var(--review-border); color: var(--review-muted); font-size: 13px; line-height: 1.5; }
@media (max-width: 430px) {
  .preview-header { min-height: 64px; padding: 10px 12px; }
  .preview-header strong { font-size: 14px; }
  .preview-header .n-select { width: 112px; }
  .preview-help { padding-inline: 12px; }
}
</style>
