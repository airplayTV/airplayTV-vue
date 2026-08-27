<template>
  <main class="review-workspace">
    <header class="review-toolbar">
      <div>
        <span class="mode-dot" aria-hidden="true" />
        <div><strong>广告标记模式</strong><small>{{ source }} · {{ video.name || video.id }}</small></div>
      </div>
      <n-button secondary type="error" @click="leave">退出标记模式</n-button>
    </header>

    <section class="episode-bar">
      <n-select v-model:value="pid" :options="episodes" filterable aria-label="选择待评审剧集" />
      <n-button type="primary" :loading="store.loading" :disabled="!pid" @click="analyze">解析当前集</n-button>
      <span v-if="store.blocks.length">已标记 {{ store.labeledCount }} / {{ store.blocks.length }} 段</span>
    </section>

    <n-alert v-if="error" type="error" :title="error" closable @close="error = ''" />

    <div v-if="store.snapshot" class="review-grid">
      <aside class="block-panel" aria-label="Discontinuity 分段列表">
        <div class="panel-heading">
          <div><span class="eyebrow">时间线</span><strong>{{ store.blocks.length }} 个分段</strong></div>
          <small>含开头未声明 Discontinuity 的第 0 段</small>
        </div>
        <div class="block-list">
          <button
            v-for="block in store.blocks"
            :key="block.id"
            type="button"
            :class="['block-item', { active: block.id === store.selectedBlockId }]"
            :aria-pressed="block.id === store.selectedBlockId"
            @click="store.selectedBlockId = block.id"
          >
            <span class="block-index">{{ block.blockIndex + 1 }}</span>
            <span class="block-meta">
              <strong>{{ formatApproxTime(block.startMs) }}–{{ formatApproxTime(block.endMs) }}</strong>
              <small>{{ block.segmentCount }} 个 TS · {{ Number(block.duration).toFixed(1) }} 秒</small>
            </span>
            <n-tag v-if="block.labelEvent" size="small" :type="labelTagType(labelOf(block))" :bordered="false">{{ labelText(labelOf(block)) }}</n-tag>
            <span v-else class="unreviewed">未标记</span>
          </button>
        </div>
      </aside>

      <div class="review-main">
        <AdReviewPlayer :snapshot-id="store.snapshot.id" :block="store.selectedBlock" />
        <section v-if="store.selectedBlock" class="label-card">
          <div>
            <span class="eyebrow">人工判断</span>
            <h3>这一段属于什么内容？</h3>
            <p>判断会作为可修订的历史事件保存，并参与下一版规则的全量回放。</p>
          </div>
          <div class="label-actions">
            <n-button type="success" :loading="saving === 'CONTENT'" @click="saveLabel('CONTENT')">正常内容</n-button>
            <n-button type="error" :loading="saving === 'AD'" @click="saveLabel('AD')">广告</n-button>
            <n-button secondary :loading="saving === 'UNSURE'" @click="saveLabel('UNSURE')">不确定</n-button>
            <n-button secondary type="warning" :loading="saving === 'UNPLAYABLE'" @click="saveLabel('UNPLAYABLE')">无法播放</n-button>
          </div>
        </section>
      </div>
    </div>

    <n-empty v-else-if="!store.loading" description="选择剧集并解析 M3U8 后，可逐段预览和标记" />

    <AdReviewRulePanel
      v-if="store.snapshot"
      :source="source"
      @review-conflict="jumpToConflict"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { NAlert, NButton, NEmpty, NSelect, NTag, useDialog, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useAdReviewStore } from '@/stores/ad-review.js'
import { formatApproxTime } from '@/helpers/ad-review-state.js'
import AdReviewPlayer from './AdReviewPlayer.vue'
import AdReviewRulePanel from './AdReviewRulePanel.vue'

const props = defineProps({ video: { type: Object, required: true }, source: { type: String, required: true } })
const store = useAdReviewStore()
const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const pid = ref(null)
const error = ref('')
const saving = ref('')
const episodes = computed(() => (props.video.links || []).map((link, index) => ({
  label: link.name || link.title || `第 ${index + 1} 集`,
  value: String(link.id),
})))

const labelOf = (block) => block.labelEvent?.Label ?? block.labelEvent?.label
const labelText = (label) => ({ CONTENT: '正常', AD: '广告', UNSURE: '不确定', UNPLAYABLE: '无法播放' }[label] || label)
const labelTagType = (label) => ({ CONTENT: 'success', AD: 'error', UNSURE: 'default', UNPLAYABLE: 'warning' }[label] || 'default')

const analyze = async () => {
  error.value = ''
  try {
    await store.loadSnapshot({ source: props.source, vid: String(props.video.id), pid: String(pid.value) })
    await store.refreshActive(props.source)
    const requestedStart = Number(route.query.ad_review_start_ms)
    if (Number.isFinite(requestedStart)) {
      const nearest = store.blocks.reduce((best, block) =>
        !best || Math.abs(block.startMs - requestedStart) < Math.abs(best.startMs - requestedStart) ? block : best, null)
      if (nearest) store.selectedBlockId = nearest.id
    }
    router.replace({ path: route.path, query: { ...route.query, pid: pid.value } })
  } catch (reason) { error.value = reason.message || '解析失败' }
}

const saveLabel = async (label) => {
  if (!store.selectedBlock || saving.value) return
  saving.value = label
  try {
    await store.label(store.selectedBlock, label)
    message.success(`第 ${store.selectedBlock.blockIndex + 1} 段已标记为${labelText(label)}`)
    const index = store.blocks.findIndex((block) => block.id === store.selectedBlockId)
    if (index >= 0 && index < store.blocks.length - 1) store.selectedBlockId = store.blocks[index + 1].id
  } catch (reason) { error.value = reason.message || '保存标记失败' } finally { saving.value = '' }
}

const jumpToConflict = (conflict) => {
  if (conflict.source !== props.source || String(conflict.vid) !== String(props.video.id) || String(conflict.pid) !== String(pid.value)) {
    router.push({
      path: `/video/detail/${conflict.vid}`,
      query: { _source: conflict.source, pid: conflict.pid, ad_review_start_ms: conflict.start_ms },
    })
    return
  }
  const block = store.blocks.find((item) => item.id === conflict.block_id) ||
    store.blocks.find((item) => Math.abs(item.startMs - Number(conflict.start_ms)) < 1000)
  if (block) store.selectedBlockId = block.id
}

const leave = () => {
  dialog.warning({
    title: '退出广告标记模式？',
    content: '已保存的历史标记不会删除。',
    positiveText: '退出',
    negativeText: '继续标记',
    onPositiveClick: async () => { await store.logout(); router.push('/setting') },
  })
}

onMounted(async () => {
  if (!store.authenticated && !await store.restore()) {
    router.replace('/setting')
    return
  }
  pid.value = String(route.query.pid || episodes.value[0]?.value || '')
})
</script>

<style scoped>
.review-workspace {
  --review-bg: #f3f6f9; --review-panel: #fff; --review-soft: #f5f7fa; --review-border: #dce3ea; --review-muted: #5d6875;
  box-sizing: border-box; width: min(1440px, 100%); margin: 0 auto; padding: 12px clamp(12px, 3vw, 32px) 40px; display: grid; gap: 14px; color: #17202a;
}
.review-toolbar, .episode-bar { min-height: 64px; padding: 10px 14px; background: var(--review-panel); border: 1px solid var(--review-border); border-radius: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.review-toolbar > div { display: flex; align-items: center; gap: 10px; }
.review-toolbar div div { display: grid; }
.review-toolbar small, .episode-bar span, .panel-heading small { color: var(--review-muted); }
.mode-dot { width: 10px; height: 10px; border-radius: 50%; background: #d03050; box-shadow: 0 0 0 4px #fde9ed; }
.episode-bar { justify-content: flex-start; }
.episode-bar .n-select { width: min(440px, 55vw); }
.review-grid { display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); gap: 14px; align-items: start; }
.block-panel { background: var(--review-panel); border: 1px solid var(--review-border); border-radius: 16px; overflow: hidden; }
.panel-heading { padding: 14px; border-bottom: 1px solid var(--review-border); display: grid; gap: 6px; }
.panel-heading > div { display: flex; justify-content: space-between; }
.eyebrow { color: var(--review-muted); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
.block-list { max-height: 620px; overflow-y: auto; padding: 8px; display: grid; gap: 6px; }
.block-item { width: 100%; min-height: 64px; padding: 8px; border: 1px solid transparent; border-radius: 10px; background: transparent; display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 8px; color: inherit; text-align: left; cursor: pointer; }
.block-item:hover { background: var(--review-soft); }
.block-item:focus-visible { outline: 3px solid rgba(24, 160, 88, .28); outline-offset: 1px; }
.block-item.active { border-color: #18a058; background: #effaf4; }
.block-index { width: 30px; height: 30px; border-radius: 8px; background: var(--review-soft); display: grid; place-items: center; font-weight: 700; }
.block-meta { display: grid; gap: 3px; min-width: 0; }
.block-meta small, .unreviewed { color: var(--review-muted); font-size: 12px; }
.review-main { display: grid; gap: 14px; min-width: 0; }
.label-card { padding: 18px; background: var(--review-panel); border: 1px solid var(--review-border); border-radius: 16px; display: grid; grid-template-columns: minmax(220px, 1fr) auto; align-items: center; gap: 18px; }
.label-card h3 { margin: 2px 0 4px; font-size: 18px; }
.label-card p { margin: 0; color: var(--review-muted); line-height: 1.5; }
.label-actions { display: grid; grid-template-columns: repeat(2, minmax(112px, 1fr)); gap: 8px; }
.label-actions .n-button { min-height: 44px; }
@media (prefers-color-scheme: dark) {
  .review-workspace { --review-bg: #101419; --review-panel: #171c22; --review-soft: #20262d; --review-border: #303943; --review-muted: #b6c0cc; color: #f3f6f9; }
  .block-item.active { background: #153a29; }
}
@media (max-width: 820px) {
  .review-grid { grid-template-columns: 1fr; }
  .block-list { max-height: 300px; }
  .label-card { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .review-workspace { padding-inline: 8px; }
  .review-toolbar, .episode-bar { align-items: stretch; flex-direction: column; }
  .review-toolbar > div { min-height: 44px; }
  .episode-bar .n-select { width: 100%; }
  .episode-bar .n-button { min-height: 44px; }
  .block-item { grid-template-columns: 34px 1fr; }
  .block-item .n-tag, .unreviewed { grid-column: 2; justify-self: start; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
</style>
