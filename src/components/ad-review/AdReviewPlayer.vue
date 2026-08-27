<template>
  <section class="preview-card" aria-label="分段视频预览">
    <div class="preview-header">
      <div>
        <span class="eyebrow">片段预览</span>
        <strong v-if="block">第 {{ block.blockIndex + 1 }} 段 · {{ timeRange }}</strong>
      </div>
      <n-select v-model:value="segmentCount" :options="countOptions" size="small" aria-label="预览片段数量" />
    </div>
    <div class="video-frame">
      <video ref="videoRef" controls playsinline preload="metadata" />
      <div v-if="!block" class="empty-player">选择左侧分段开始预览</div>
    </div>
    <p class="preview-help">默认播放本段第一个有效媒体片段；需要更多上下文时可切换为 3、5 或 10 个。</p>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { NSelect } from 'naive-ui'
import Hls from 'hls.js'
import { adReviewAPI } from '@/helpers/ad-review-api.js'
import { formatApproxTime } from '@/helpers/ad-review-state.js'

const props = defineProps({ snapshotId: Number, block: Object })
const videoRef = ref(null)
const segmentCount = ref(1)
let hls = null
const countOptions = [1, 3, 5, 10].map((value) => ({ label: `${value} 个片段`, value }))
const timeRange = computed(() => `${formatApproxTime(props.block?.startMs)}–${formatApproxTime(props.block?.endMs)}`)

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
  const url = adReviewAPI.previewURL(props.snapshotId, props.block.id, segmentCount.value)
  if (Hls.isSupported()) {
    hls = new Hls()
    hls.loadSource(url)
    hls.attachMedia(videoRef.value)
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoRef.value.src = url
  }
}

watch([() => props.snapshotId, () => props.block?.id, segmentCount], load, { flush: 'post' })
onBeforeUnmount(destroyPlayer)
</script>

<style scoped>
.preview-card { background: var(--review-panel); border: 1px solid var(--review-border); border-radius: var(--review-radius); overflow: hidden; box-shadow: var(--review-shadow); }
.preview-header { min-height: 68px; padding: 12px 16px; border-bottom: 1px solid var(--review-border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.preview-header > div { display: grid; gap: 3px; }
.preview-header strong { font-size: 16px; font-variant-numeric: tabular-nums; }
.preview-header .n-select { width: 126px; }
.eyebrow { color: var(--review-muted); font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.video-frame { position: relative; aspect-ratio: 16 / 9; background: #0b0f14; }
video { width: 100%; height: 100%; display: block; background: #0b0f14; }
.empty-player { position: absolute; inset: 0; display: grid; place-items: center; color: #a7b0bd; }
.preview-help { margin: 0; padding: 11px 16px 13px; border-top: 1px solid var(--review-border); color: var(--review-muted); font-size: 13px; line-height: 1.5; }
@media (max-width: 430px) {
  .preview-header { min-height: 64px; padding: 10px 12px; }
  .preview-header strong { font-size: 14px; }
  .preview-header .n-select { width: 112px; }
  .preview-help { padding-inline: 12px; }
}
</style>
