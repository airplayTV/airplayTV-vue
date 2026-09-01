<template>
  <div class="history-shell">
    <AppHeader />
    <AdReviewAccessGate @ready="loadHistory">
      <main class="history-page">
        <header class="page-hero">
          <div>
            <span class="eyebrow">ADMIN REVIEW</span>
            <h1>广告标记历史</h1>
            <p>仅展示产生过人工标签的视频。普通观看历史不会出现在这里。</p>
          </div>
          <n-button type="primary" size="large" @click="router.push('/video/list')">去选择视频校准</n-button>
        </header>

        <form class="filter-panel" @submit.prevent="submitFilters">
          <label>
            <span>来源</span>
            <n-select
              v-model:value="source"
              :options="sourceOptions"
              filterable
              clearable
              placeholder="全部来源"
            />
          </label>
          <label>
            <span>视频或 VID</span>
            <n-input v-model:value="keyword" clearable placeholder="输入名称或 VID" />
          </label>
          <n-button attr-type="submit" type="primary" :loading="store.historyLoading">查询</n-button>
        </form>

        <n-alert v-if="store.historyError" type="error" role="alert" closable @close="store.historyError = ''">
          {{ store.historyError }}
          <template #action><n-button text type="error" @click="loadHistory">重试</n-button></template>
        </n-alert>

        <section class="result-heading">
          <div><strong>{{ store.historyPage.total }}</strong><span>个已标记视频</span></div>
          <small>按最近标记时间排序</small>
        </section>

        <div v-if="store.historyLoading" class="loading-list" aria-busy="true">
          <n-skeleton v-for="index in 3" :key="index" height="168px" :sharp="false" />
        </div>
        <div v-else-if="store.historyPage.items.length" class="video-list">
          <AdReviewVideoCard
            v-for="video in store.historyPage.items"
            :key="`${video.source}:${video.vid}`"
            :video="video"
            :deleting-snapshot-id="store.deletingSnapshotId"
            @delete-snapshot="deleteSnapshot"
          />
        </div>
        <n-empty v-else description="暂时没有产生过人工标签的视频">
          <template #extra><n-button type="primary" secondary @click="router.push('/video/list')">开始第一次校准</n-button></template>
        </n-empty>

        <n-pagination
          v-if="store.historyPage.total > store.historyPage.pageSize"
          :page="store.historyPage.page"
          :page-size="store.historyPage.pageSize"
          :item-count="store.historyPage.total"
          @update:page="changePage"
        />
      </main>
    </AdReviewAccessGate>
    <AppFooter />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { NAlert, NButton, NEmpty, NInput, NPagination, NSelect, NSkeleton, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AdReviewAccessGate from '@/components/ad-review/AdReviewAccessGate.vue'
import AdReviewVideoCard from '@/components/ad-review/AdReviewVideoCard.vue'
import { useAdReviewStore } from '@/stores/ad-review.js'
import { useAppStore } from '@/stores/app.js'
import { normalizeAdReviewHistoryFilter } from '@/helpers/ad-review-history.js'
import { formatVideoSourceOptions } from '@/helpers/video-source-options.js'

const router = useRouter()
const store = useAdReviewStore()
const appStore = useAppStore()
const message = useMessage()
const keyword = ref('')
const source = ref('')
const sourceOptions = computed(() => formatVideoSourceOptions(appStore.sourceList))

const loadHistory = async (page = 1) => {
  try {
    await store.loadHistory(normalizeAdReviewHistoryFilter({ keyword: keyword.value, source: source.value, page }))
  } catch (_) {
    // The store exposes the project-style API message inline.
  }
}

const submitFilters = () => loadHistory(1)
const changePage = (page) => {
  loadHistory(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteSnapshot = async (snapshot) => {
  try {
    await store.deleteSnapshot(snapshot.id, normalizeAdReviewHistoryFilter({
      keyword: keyword.value,
      source: source.value,
      page: store.historyPage.page,
      pageSize: store.historyPage.pageSize,
    }))
    message.success(`快照 #${snapshot.id} 已永久删除`)
  } catch (_) {
    // The store exposes the project-style API message inline.
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
.filter-panel { padding: 14px; border: 1px solid var(--history-border); border-radius: 14px; background: var(--history-panel); display: grid; grid-template-columns: minmax(180px, 1.4fr) minmax(150px, 1fr) auto; align-items: end; gap: 10px; }
.filter-panel label { display: grid; gap: 6px; color: var(--history-muted); font-size: 12px; font-weight: 600; }
.filter-panel .n-button { min-width: 92px; min-height: 34px; }
.result-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; }
.result-heading > div { display: flex; align-items: baseline; gap: 6px; }
.result-heading strong { font-size: 22px; }
.result-heading span, .result-heading small { color: var(--history-muted); }
.video-list, .loading-list { display: grid; gap: 12px; }
.n-pagination { justify-self: center; margin-top: 8px; }
@media (prefers-color-scheme: dark) {
  .history-page { --history-panel: #171d22; --history-soft: #20272c; --history-border: #354039; --history-muted: #b7c1bb; --history-text: #f1f5f2; --history-accent-soft: #153326; --history-shadow: 0 10px 28px rgba(0, 0, 0, .13); }
}
@media (max-width: 640px) {
  .history-page { padding: 12px 8px 36px; gap: 12px; }
  .page-hero { align-items: stretch; flex-direction: column; padding: 17px; }
  .page-hero .n-button { width: 100%; }
  .filter-panel { grid-template-columns: 1fr; }
  .filter-panel .n-button { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
</style>
