<template>
  <div class="history-shell">
    <AppHeader />
    <AdReviewAccessGate @ready="loadRuleOverview">
      <main class="history-page">
        <header class="page-hero">
          <div>
            <span class="eyebrow">ADMIN REVIEW</span>
            <h1>广告来源规则</h1>
            <p>集中查看每个来源的标记统计、运行时规则和可同步配置。</p>
          </div>
          <n-button type="primary" size="large" @click="router.push('/video/list')">去选择视频校准</n-button>
        </header>

        <AdReviewRuleOverview
          :overview="store.ruleOverview"
          :loading="store.ruleOverviewLoading"
          :error="store.ruleOverviewError"
          :deleting-source="store.deletingSource"
          @retry="loadRuleOverview"
          @clear-error="store.ruleOverviewError = ''"
          @view-history="viewHistory"
          @request-delete-source="requestDeleteSource"
        />
      </main>
    </AdReviewAccessGate>
    <AppFooter />

    <n-modal
      v-model:show="showDeleteSource"
      preset="card"
      title="删除来源标记数据"
      class="delete-source-modal"
      :bordered="false"
      :mask-closable="!store.deletingSource"
      :close-on-esc="!store.deletingSource"
    >
      <n-alert type="error" :bordered="false">
        将永久删除“{{ deleteSource }}”下全部视频、剧集、快照及其标记数据。规则版本、激活记录和静态配置会保留。
      </n-alert>
      <label class="confirm-field">
        <span>输入完整来源名以确认</span>
        <n-input v-model:value="confirmSource" :placeholder="deleteSource" :disabled="Boolean(store.deletingSource)" />
      </label>
      <template #footer>
        <div class="modal-actions">
          <n-button :disabled="Boolean(store.deletingSource)" @click="closeDeleteSource">取消</n-button>
          <n-button
            type="error"
            :loading="Boolean(store.deletingSource)"
            :disabled="confirmSource.trim() !== deleteSource"
            @click="confirmDeleteSource"
          >
            永久删除全部标记数据
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NAlert, NButton, NInput, NModal, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AdReviewAccessGate from '@/components/ad-review/AdReviewAccessGate.vue'
import AdReviewRuleOverview from '@/components/ad-review/AdReviewRuleOverview.vue'
import { useAdReviewStore } from '@/stores/ad-review.js'
import { buildAdReviewHistoryListRoute } from '@/helpers/ad-review-history.js'

const router = useRouter()
const store = useAdReviewStore()
const message = useMessage()
const showDeleteSource = ref(false)
const deleteSource = ref('')
const confirmSource = ref('')

const loadRuleOverview = async () => {
  try {
    await store.loadRuleOverview()
  } catch (_) {
    // The overview keeps an independent inline error.
  }
}

const viewHistory = (source) => router.push(buildAdReviewHistoryListRoute(source))
const requestDeleteSource = (source) => {
  deleteSource.value = source
  confirmSource.value = ''
  showDeleteSource.value = true
}
const closeDeleteSource = () => {
  if (store.deletingSource) return
  showDeleteSource.value = false
}
const confirmDeleteSource = async () => {
  if (confirmSource.value.trim() !== deleteSource.value || store.deletingSource) return
  try {
    const result = await store.deleteSourceReviewData(deleteSource.value)
    showDeleteSource.value = false
    message.success(`已删除 ${result.snapshot_count || 0} 个快照及相关标记数据`)
  } catch (_) {
    // The store exposes the server error inline.
  }
}
</script>

<style scoped>
.history-shell { min-height: 100vh; display: flex; flex-direction: column; }
.history-page { --history-panel: #fff; --history-soft: #f5f8f6; --history-border: #dfe6e1; --history-muted: #61706a; --history-text: #17211c; --history-accent: #18a058; --history-accent-soft: #eaf7ef; --history-shadow: 0 1px 2px rgba(24, 38, 30, .04), 0 10px 28px rgba(24, 38, 30, .04); width: 100%; flex: 1; padding: 10px 10px 48px; box-sizing: border-box; color: var(--history-text); display: grid; align-content: start; gap: 16px; }
.page-hero { padding: 22px; border: 1px solid var(--history-border); border-radius: 18px; background: var(--history-panel); box-shadow: var(--history-shadow); display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.page-hero h1 { margin: 3px 0 5px; font-size: clamp(25px, 4vw, 34px); letter-spacing: -.025em; }
.page-hero p { margin: 0; color: var(--history-muted); line-height: 1.55; }
.page-hero .n-button { min-height: 46px; flex: 0 0 auto; }
.eyebrow { color: var(--history-accent); font-size: 11px; font-weight: 700; letter-spacing: .12em; }
.confirm-field { margin-top: 18px; display: grid; gap: 8px; color: var(--history-muted); font-weight: 600; }
.confirm-field .n-input { min-height: 44px; }
.modal-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
.modal-actions .n-button { min-height: 44px; }
:global(.delete-source-modal) { width: min(620px, calc(100vw - 24px)); }
@media (prefers-color-scheme: dark) {
  .history-page { --history-panel: #171d22; --history-soft: #20272c; --history-border: #354039; --history-muted: #b7c1bb; --history-text: #f1f5f2; --history-accent-soft: #153326; --history-shadow: 0 10px 28px rgba(0, 0, 0, .13); }
}
@media (max-width: 640px) {
  .history-page { padding: 12px 8px 36px; gap: 12px; }
  .page-hero { align-items: stretch; flex-direction: column; padding: 17px; }
  .page-hero .n-button, .modal-actions .n-button { width: 100%; }
  .modal-actions { display: grid; grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
</style>
