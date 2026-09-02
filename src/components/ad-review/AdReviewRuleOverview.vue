<template>
  <section class="rule-overview" aria-labelledby="rule-overview-title">
    <header class="overview-heading">
      <div>
        <span class="eyebrow">RULE INVENTORY</span>
        <h2 id="rule-overview-title">来源规则概览</h2>
        <p>汇总人工标记、数据库生效规则、候选规则与当前静态配置。</p>
      </div>
      <div class="overview-actions">
        <n-button secondary :loading="loading" @click="$emit('retry')">刷新</n-button>
        <n-button secondary :disabled="!summary.pendingSyncCount" @click="openJSON('pending')">预览待同步 JSON</n-button>
        <n-button type="primary" :disabled="!items.length" @click="openJSON('all')">预览完整配置</n-button>
      </div>
    </header>

    <n-alert v-if="error" type="error" role="alert" closable @close="$emit('clear-error')">
      {{ error }}
      <template #action><n-button text type="error" @click="$emit('retry')">重试</n-button></template>
    </n-alert>

    <div class="summary-grid" aria-label="规则概览统计">
      <div><strong>{{ summary.labeledSourceCount }}</strong><span>已标记来源</span></div>
      <div><strong>{{ summary.activeRuleCount }}</strong><span>生效规则</span></div>
      <div><strong>{{ summary.pendingSyncCount }}</strong><span>待同步配置</span></div>
      <div><strong>{{ summary.withoutRuleCount }}</strong><span>暂无有效规则</span></div>
    </div>

    <div v-if="loading" class="overview-loading" aria-busy="true">
      <n-skeleton v-for="index in 4" :key="index" height="178px" :sharp="false" />
    </div>
    <div v-else-if="items.length" class="source-rule-list">
      <article v-for="item in items" :key="item.source || '__global__'" class="source-rule-card">
        <div class="source-rule-head">
          <div class="source-title">
            <h3>{{ item.source || '全局规则' }}</h3>
            <div class="status-tags">
              <n-tag :type="statusMeta[item.syncStatus]?.type || 'default'" size="small" round>
                {{ statusMeta[item.syncStatus]?.label || '未知状态' }}
              </n-tag>
              <n-tag v-if="item.active?.activation?.mode" size="small" :bordered="false">
                {{ item.active.activation.mode === 'permanent' ? '永久' : '临时' }}
              </n-tag>
              <n-tag v-if="item.active?.activation?.forced" type="error" size="small" :bordered="false">强制生效</n-tag>
            </div>
          </div>
          <div class="card-actions">
            <n-button v-if="item.source && item.statistics" secondary type="primary" @click="$emit('view-history', item.source)">查看标记历史</n-button>
            <n-button v-if="canCopySource(item)" text type="primary" @click="copySource(item)">复制单源 JSON</n-button>
            <n-button
              v-if="item.source && item.statistics"
              secondary
              type="error"
              :loading="deletingSource === item.source"
              :disabled="Boolean(deletingSource)"
              @click="$emit('request-delete-source', item.source)"
            >
              删除标记数据
            </n-button>
          </div>
        </div>

        <div v-if="item.statistics" class="source-stat-line">
          <span>视频 <strong>{{ item.statistics.videoCount }}</strong></span>
          <span>快照 <strong>{{ item.statistics.snapshotCount }}</strong></span>
          <span>标签块 <strong>{{ item.statistics.labeledBlockCount }}</strong></span>
          <span>AD <strong>{{ item.statistics.labelCounts.AD }}</strong></span>
          <span>CONTENT <strong>{{ item.statistics.labelCounts.CONTENT }}</strong></span>
          <span class="latest-time">最近标记 {{ formatDate(item.statistics.latestLabeledAt) }}</span>
        </div>
        <div v-else class="source-stat-line source-stat-empty">当前没有保留的人工标记历史</div>

        <div v-if="selectOverviewRule(item)" class="rule-metrics">
          <div><span>片段数范围</span><strong>{{ segmentRange(selectOverviewRule(item)) }}</strong></div>
          <div><span>时长范围</span><strong>{{ durationRange(selectOverviewRule(item)) }}</strong></div>
          <div><span>规则来源</span><strong>{{ ruleOrigin(item) }}</strong></div>
        </div>

        <n-alert v-if="item.latestCandidate" type="warning" :bordered="false" class="candidate-note">
          最新候选 #{{ item.latestCandidate.id }}（{{ item.latestCandidate.version || '无版本号' }}）未生效，不会进入默认配置导出。
        </n-alert>

        <details class="rule-details">
          <summary>查看规则详情</summary>
          <div class="detail-grid">
            <section>
              <h4>运行时规则</h4>
              <template v-if="item.active">
                <dl>
                  <div><dt>规则 ID</dt><dd>#{{ item.active.rule.id }}</dd></div>
                  <div><dt>版本</dt><dd class="token">{{ item.active.rule.version || '—' }}</dd></div>
                  <div><dt>Activation</dt><dd>#{{ item.active.activation.id }}</dd></div>
                  <div><dt>冲突数</dt><dd>{{ item.active.activation.conflict_count ?? item.active.activation.ConflictCount ?? 0 }}</dd></div>
                </dl>
              </template>
              <p v-else>当前没有数据库生效规则。</p>
            </section>
            <section>
              <h4>静态配置</h4>
              <pre v-if="item.staticPolicy">{{ formatPolicy(item.source, item.staticPolicy) }}</pre>
              <p v-else>当前 config.json 没有该来源。</p>
            </section>
          </div>
        </details>
      </article>
    </div>
    <n-empty v-else description="暂无来源标记、规则或静态配置" />

    <n-modal v-model:show="showJSON" preset="card" :title="jsonTitle" class="json-modal" :bordered="false">
      <p class="json-help">
        {{ jsonMode === 'pending' ? '仅包含数据库生效且与静态配置不一致的来源；候选和继承规则已排除。' : '包含来源专属生效规则及服务器当前已有静态配置；候选规则已排除。' }}
      </p>
      <pre class="json-preview" tabindex="0">{{ currentJSON }}</pre>
      <template #footer>
        <div class="modal-actions">
          <n-button @click="showJSON = false">关闭</n-button>
          <n-button type="primary" @click="copyCurrentJSON">复制完整 m3u8_proxy</n-button>
        </div>
      </template>
    </n-modal>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import copy from 'copy-to-clipboard'
import { NAlert, NButton, NEmpty, NModal, NSkeleton, NTag, useMessage } from 'naive-ui'
import { formatAdRuleRange } from '@/helpers/ad-review-state.js'
import {
  buildM3u8ProxyConfig,
  formatM3u8ProxyConfig,
  selectOverviewRule,
} from '@/helpers/ad-review-rule-overview.js'

const props = defineProps({
  overview: { type: Object, required: true },
  loading: Boolean,
  error: { type: String, default: '' },
  deletingSource: { type: String, default: '' },
})
defineEmits(['retry', 'clear-error', 'view-history', 'request-delete-source'])

const message = useMessage()
const showJSON = ref(false)
const jsonMode = ref('pending')
const summary = computed(() => props.overview?.summary ?? {})
const items = computed(() => props.overview?.items ?? [])
const allConfig = computed(() => buildM3u8ProxyConfig(items.value))
const pendingConfig = computed(() => buildM3u8ProxyConfig(items.value, { pendingOnly: true }))
const currentJSON = computed(() => formatM3u8ProxyConfig(jsonMode.value === 'pending' ? pendingConfig.value : allConfig.value))
const jsonTitle = computed(() => jsonMode.value === 'pending' ? '待同步规则 JSON' : '完整 m3u8_proxy 预览')

const statusMeta = {
  synced: { label: '已同步', type: 'success' },
  pending: { label: '待同步', type: 'warning' },
  configured_only: { label: '仅静态配置', type: 'info' },
  candidate_only: { label: '候选未发布', type: 'warning' },
  inherited: { label: '继承全局', type: 'default' },
  not_applicable: { label: '全局规则', type: 'default' },
  none: { label: '暂无规则', type: 'default' },
}

const openJSON = (mode) => {
  jsonMode.value = mode
  showJSON.value = true
}
const canCopySource = (item) => Boolean(item.source && ((item.active && !item.active.inherited) || item.staticPolicy))
const copyText = (text, successMessage) => {
  if (!copy(text)) return message.error('复制失败，请手动选择 JSON')
  message.success(successMessage)
}
const copyCurrentJSON = () => copyText(currentJSON.value, 'm3u8_proxy 配置已复制')
const copySource = (item) => copyText(
  formatM3u8ProxyConfig(buildM3u8ProxyConfig([item])),
  `${item.source} 配置已复制`,
)
const formatPolicy = (source, policy) => formatM3u8ProxyConfig(buildM3u8ProxyConfig([{
  source,
  active: null,
  staticPolicy: policy,
}])).replace(/^\{\n  "m3u8_proxy": /, '').replace(/\n\}$/, '')
const segmentRange = (rule) => formatAdRuleRange(rule.minSegment, rule.maxSegment)
const durationRange = (rule) => formatAdRuleRange(rule.minDuration, rule.maxDuration, { digits: 3, suffix: ' 秒' })
const ruleOrigin = (item) => item.active ? (item.active.inherited ? '继承全局' : '数据库生效') : item.staticPolicy ? '静态配置' : '候选未发布'
const formatDate = (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—'
</script>

<style scoped>
.rule-overview { display: grid; gap: 16px; }
.overview-heading { padding: 18px 20px; border: 1px solid var(--history-border); border-radius: 16px; background: var(--history-panel); box-shadow: var(--history-shadow); display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.overview-heading h2 { margin: 3px 0 4px; font-size: 20px; }
.overview-heading p, .json-help { margin: 0; color: var(--history-muted); line-height: 1.55; }
.overview-actions, .modal-actions, .card-actions, .status-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.overview-actions .n-button, .modal-actions .n-button, .card-actions .n-button { min-height: 44px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.summary-grid > div { min-height: 84px; padding: 14px 16px; border: 1px solid var(--history-border); border-radius: 14px; background: var(--history-panel); display: grid; align-content: center; gap: 3px; }
.summary-grid strong { font-size: 25px; font-variant-numeric: tabular-nums; }
.summary-grid span { color: var(--history-muted); font-size: 13px; }
.overview-loading, .source-rule-list { display: grid; gap: 12px; }
.source-rule-card { padding: 18px; border: 1px solid var(--history-border); border-radius: 15px; background: var(--history-panel); box-shadow: var(--history-shadow); display: grid; gap: 14px; }
.source-rule-head, .source-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.source-title { min-width: 0; justify-content: flex-start; flex-wrap: wrap; }
.source-title h3 { min-width: 0; margin: 0; font-size: 18px; overflow-wrap: anywhere; }
.source-stat-line { padding: 10px 12px; border-radius: 10px; background: var(--history-soft); display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; color: var(--history-muted); font-size: 13px; }
.source-stat-line strong { color: var(--history-text); font-variant-numeric: tabular-nums; }
.source-stat-empty { font-style: italic; }
.latest-time { margin-left: auto; }
.rule-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.rule-metrics > div { min-width: 0; display: grid; gap: 4px; }
.rule-metrics span { color: var(--history-muted); font-size: 12px; }
.rule-metrics strong { overflow-wrap: anywhere; font-size: 15px; font-variant-numeric: tabular-nums; }
.candidate-note { margin-top: -2px; }
.rule-details { border-top: 1px solid var(--history-border); padding-top: 12px; }
.rule-details summary { width: fit-content; min-height: 44px; color: var(--history-accent); font-weight: 600; cursor: pointer; display: flex; align-items: center; }
.rule-details summary:focus-visible { outline: 3px solid rgba(24, 160, 88, .3); outline-offset: 2px; border-radius: 5px; }
.detail-grid { padding-top: 8px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.detail-grid section { min-width: 0; padding: 13px; border-radius: 11px; background: var(--history-soft); }
.detail-grid h4 { margin: 0 0 10px; }
.detail-grid p { margin: 0; color: var(--history-muted); }
.detail-grid dl { margin: 0; display: grid; gap: 7px; }
.detail-grid dl > div { display: flex; justify-content: space-between; gap: 10px; }
.detail-grid dt { color: var(--history-muted); }
.detail-grid dd { min-width: 0; margin: 0; text-align: right; }
.token { overflow-wrap: anywhere; }
pre { max-width: 100%; margin: 0; overflow: auto; font: 12px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace; }
.json-preview { max-height: min(58vh, 620px); margin-top: 12px; padding: 14px; border: 1px solid var(--history-border); border-radius: 10px; background: var(--history-soft); color: var(--history-text); }
.modal-actions { justify-content: flex-end; }
:global(.json-modal) { width: min(760px, calc(100vw - 24px)); }
@media (max-width: 760px) {
  .overview-heading, .source-rule-head { align-items: stretch; flex-direction: column; }
  .overview-actions { display: grid; grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rule-metrics, .detail-grid { grid-template-columns: 1fr; }
  .latest-time { width: 100%; margin-left: 0; }
}
@media (max-width: 430px) {
  .overview-heading, .source-rule-card { padding: 15px; }
  .card-actions { display: grid; grid-template-columns: 1fr; }
  .summary-grid > div { min-height: 76px; }
}
</style>
