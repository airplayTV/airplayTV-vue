<template>
  <div class="snapshot-shell">
    <AppHeader />
    <AdReviewAccessGate @ready="loadSnapshot">
      <main class="snapshot-page">
        <header class="snapshot-toolbar">
          <n-button secondary @click="router.back()">返回标记历史</n-button>
          <div v-if="detail">
            <span>历史快照 #{{ detail.snapshot.id }}</span>
            <strong>{{ detail.snapshot.videoName || detail.snapshot.vid }}</strong>
            <small>{{ detail.snapshot.source }} · PID {{ detail.snapshot.pid }}</small>
          </div>
          <n-button v-if="detail" type="primary" @click="recalibrate">重新校准本集</n-button>
        </header>

        <n-alert v-if="store.historySnapshotError" type="error" role="alert">
          {{ store.historySnapshotError }}
          <template #action><n-button text type="error" @click="loadSnapshot">重试</n-button></template>
        </n-alert>

        <div v-if="store.historySnapshotLoading" class="snapshot-loading" aria-busy="true">
          <n-skeleton height="520px" :sharp="false" />
        </div>
        <div v-else-if="detail" class="snapshot-grid">
          <aside class="block-panel" aria-label="历史快照分段列表">
            <div class="panel-heading">
              <span>分段记录</span><strong>{{ detail.blocks.length }} 段</strong>
            </div>
            <div ref="blockListRef" class="block-list">
              <button
                v-for="block in detail.blocks"
                :key="block.id"
                type="button"
                :class="['block-item', { active: block.id === selectedBlockId }]"
                :aria-pressed="block.id === selectedBlockId"
                :data-block-id="block.id"
                @click="selectedBlockId = block.id"
              >
                <span class="block-index">{{ block.blockIndex + 1 }}</span>
                <span class="block-meta">
                  <strong>{{ formatApproxTime(block.startMs) }}–{{ formatApproxTime(block.endMs) }}</strong>
                  <small>{{ block.segmentCount }} 个媒体片段 · {{ Number(block.duration).toFixed(1) }} 秒</small>
                </span>
                <n-tag v-if="block.labelEvent" size="small" :type="labelTagType(block.labelEvent.label)" :bordered="false">
                  {{ labelText(block.labelEvent.label) }}
                </n-tag>
                <span v-else class="unreviewed">未标记</span>
              </button>
            </div>
          </aside>

          <section class="snapshot-main">
            <AdReviewPlayer :snapshot-id="detail.snapshot.id" :block="selectedBlock" />
            <div class="readonly-note">
              <div><strong>历史快照为只读记录</strong><p>重新校准会解析当前播放列表并创建新快照，旧标签不会被覆盖。</p></div>
              <n-button type="primary" secondary @click="recalibrate">重新校准本集</n-button>
            </div>
          </section>
        </div>
      </main>
    </AdReviewAccessGate>
    <AppFooter />
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { NAlert, NButton, NSkeleton, NTag } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AdReviewAccessGate from '@/components/ad-review/AdReviewAccessGate.vue'
import AdReviewPlayer from '@/components/ad-review/AdReviewPlayer.vue'
import { useAdReviewStore } from '@/stores/ad-review.js'
import { buildAdReviewCalibrationRoute } from '@/helpers/ad-review-history.js'
import { formatApproxTime } from '@/helpers/ad-review-state.js'

const route = useRoute()
const router = useRouter()
const store = useAdReviewStore()
const selectedBlockId = ref(null)
const blockListRef = ref(null)
const detail = computed(() => store.historySnapshot)
const selectedBlock = computed(() => detail.value?.blocks.find((block) => block.id === selectedBlockId.value) ?? null)

const labelText = (label) => ({ CONTENT: '正常', AD: '广告', UNSURE: '不确定', UNPLAYABLE: '无法播放' }[label] || label)
const labelTagType = (label) => ({ CONTENT: 'success', AD: 'error', UNSURE: 'default', UNPLAYABLE: 'warning' }[label] || 'default')

const loadSnapshot = async () => {
  try {
    const loaded = await store.loadSnapshotDetail(route.params.snapshotId)
    selectedBlockId.value = loaded.blocks[0]?.id ?? null
  } catch (_) {
    selectedBlockId.value = null
  }
}

const recalibrate = () => {
  if (!detail.value) return
  router.push(buildAdReviewCalibrationRoute(detail.value.snapshot))
}

watch(selectedBlockId, async (blockId) => {
  if (!blockId) return
  await nextTick()
  blockListRef.value?.querySelector(`[data-block-id="${blockId}"]`)?.scrollIntoView({ block: 'nearest' })
})
</script>

<style scoped>
.snapshot-shell { min-height: 100vh; display: flex; flex-direction: column; background: #f5f7f9; }
.snapshot-page { --snapshot-panel: #fff; --snapshot-soft: #f6f8f7; --snapshot-border: #dfe6e1; --snapshot-muted: #61706a; --snapshot-text: #17211c; --snapshot-accent: #18a058; width: min(1320px, 100%); flex: 1; margin: 0 auto; padding: 18px clamp(10px, 3vw, 28px) 44px; box-sizing: border-box; color: var(--snapshot-text); display: grid; align-content: start; gap: 14px; }
.snapshot-toolbar { min-height: 70px; padding: 12px 15px; border: 1px solid var(--snapshot-border); border-radius: 15px; background: var(--snapshot-panel); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 16px; }
.snapshot-toolbar > div { display: grid; gap: 2px; }
.snapshot-toolbar span, .snapshot-toolbar small { color: var(--snapshot-muted); font-size: 12px; }
.snapshot-toolbar .n-button { min-height: 44px; }
.snapshot-grid { display: grid; grid-template-columns: minmax(300px, 356px) minmax(0, 1fr); gap: 16px; align-items: start; }
.block-panel { position: sticky; top: 12px; border: 1px solid var(--snapshot-border); border-radius: 16px; background: var(--snapshot-panel); overflow: hidden; }
.panel-heading { min-height: 54px; padding: 0 15px; border-bottom: 1px solid var(--snapshot-border); background: var(--snapshot-soft); display: flex; align-items: center; justify-content: space-between; }
.block-list { max-height: 640px; overflow-y: auto; padding: 8px; display: grid; gap: 4px; scrollbar-gutter: stable; }
.block-item { width: 100%; min-height: 68px; padding: 7px 10px 7px 12px; border: 1px solid transparent; border-radius: 11px; background: transparent; display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 9px; color: inherit; text-align: left; cursor: pointer; }
.block-item:hover { background: var(--snapshot-soft); }
.block-item:focus-visible { outline: 3px solid rgba(24, 160, 88, .24); outline-offset: 1px; }
.block-item.active { border-color: var(--snapshot-border); background: #edf8f2; box-shadow: inset 3px 0 var(--snapshot-accent); }
.block-index { width: 30px; height: 30px; border: 1px solid var(--snapshot-border); border-radius: 9px; background: var(--snapshot-soft); display: grid; place-items: center; font-weight: 700; }
.block-meta { display: grid; gap: 2px; min-width: 0; }
.block-meta strong { font-size: 14px; font-variant-numeric: tabular-nums; }
.block-meta small, .unreviewed { color: var(--snapshot-muted); font-size: 12px; }
.snapshot-main { display: grid; gap: 14px; min-width: 0; }
.readonly-note { padding: 17px; border: 1px solid var(--snapshot-border); border-radius: 15px; background: var(--snapshot-panel); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.readonly-note p { margin: 4px 0 0; color: var(--snapshot-muted); line-height: 1.5; }
.readonly-note .n-button { min-height: 44px; flex: 0 0 auto; }
@media (prefers-color-scheme: dark) {
  .snapshot-shell { background: #101419; }
  .snapshot-page { --snapshot-panel: #171d22; --snapshot-soft: #20272c; --snapshot-border: #354039; --snapshot-muted: #b7c1bb; --snapshot-text: #f1f5f2; }
  .block-item.active { background: #153326; }
}
@media (max-width: 820px) {
  .snapshot-grid { grid-template-columns: 1fr; }
  .block-panel { position: static; }
  .block-list { max-height: 360px; }
}
@media (max-width: 560px) {
  .snapshot-page { padding: 10px 8px 34px; }
  .snapshot-toolbar { grid-template-columns: 1fr; align-items: stretch; }
  .snapshot-toolbar .n-button { width: 100%; }
  .block-item { min-height: 72px; grid-template-columns: 34px 1fr; }
  .block-item .n-tag, .unreviewed { grid-column: 2; justify-self: start; }
  .readonly-note { align-items: stretch; flex-direction: column; }
  .readonly-note .n-button { width: 100%; }
}
</style>
