<template>
  <section class="rule-panel">
    <div class="section-heading">
      <div>
        <span class="eyebrow">规则发布</span>
        <h3>从全部历史标记生成候选规则</h3>
      </div>
      <n-button type="primary" :loading="generating" :disabled="!labeledCount" @click="generate">生成候选</n-button>
    </div>

    <n-alert v-if="activeActivation" type="success" :bordered="false">
      当前规则 #{{ activeRuleId }} 正在生效
      <template #action><n-button text type="error" @click="showRollback = true">回退</n-button></template>
    </n-alert>

    <div v-if="rule" class="rule-summary">
      <div><span>来源范围</span><strong>{{ field(rule, 'Source', 'source') || '全局' }}</strong></div>
      <div><span>最大片段数</span><strong>≤ {{ field(rule, 'MaxSegment', 'max_segment') }}</strong></div>
      <div><span>最大时长</span><strong>≤ {{ Number(field(rule, 'MaxDuration', 'max_duration')).toFixed(1) }} 秒</strong></div>
      <div><span>历史广告命中</span><strong>{{ field(evaluation, 'AdMatched', 'ad_matched') || 0 }}</strong></div>
    </div>

    <n-alert v-if="conflicts.length" type="error" title="发现 CONTENT → AD 冲突" :bordered="false">
      新规则会把 {{ conflicts.length }} 个曾标记为正常内容的分段判为广告。默认禁止发布；请先逐条复核，或填写原因强制发布。
    </n-alert>

    <div v-if="conflicts.length" class="conflict-list">
      <button v-for="conflict in conflicts" :key="conflict.id" type="button" @click="$emit('review-conflict', conflict)">
        <span>{{ conflict.source }} · {{ conflict.vid }} / {{ conflict.pid }}</span>
        <strong>{{ formatApproxTime(conflict.start_ms) }}–{{ formatApproxTime(conflict.end_ms) }}</strong>
      </button>
    </div>

    <div v-if="rule" class="publish-row">
      <n-select v-model:value="mode" :options="modeOptions" aria-label="规则生效时间" />
      <n-button type="success" :loading="publishing" :disabled="conflicts.length > 0" @click="publish(false)">应用规则</n-button>
      <n-button v-if="conflicts.length" type="error" secondary @click="showForce = true">强制应用</n-button>
    </div>

    <n-modal v-model:show="showForce" preset="dialog" title="强制应用存在冲突的规则" positive-text="确认强制应用" negative-text="取消" :positive-button-props="{ type: 'error', disabled: !forceReason.trim() }" @positive-click="publish(true)">
      <n-input v-model:value="forceReason" type="textarea" placeholder="必填：说明为何接受正常内容被过滤的风险" />
    </n-modal>
    <n-modal v-model:show="showRollback" preset="dialog" title="回退当前规则" positive-text="确认回退" negative-text="取消" :positive-button-props="{ type: 'error', disabled: !rollbackReason.trim() }" @positive-click="rollback">
      <n-input v-model:value="rollbackReason" type="textarea" placeholder="必填：记录本次回退原因" />
    </n-modal>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { NAlert, NButton, NInput, NModal, NSelect, useMessage } from 'naive-ui'
import { useAdReviewStore } from '@/stores/ad-review.js'
import { formatApproxTime } from '@/helpers/ad-review-state.js'

const props = defineProps({ source: String })
defineEmits(['review-conflict'])
const store = useAdReviewStore()
const message = useMessage()
const generating = ref(false)
const publishing = ref(false)
const mode = ref('permanent')
const showForce = ref(false)
const forceReason = ref('')
const showRollback = ref(false)
const rollbackReason = ref('')
const modeOptions = [
  { label: '长期生效', value: 'permanent' },
  { label: '临时 30 分钟', value: 'temporary-30' },
  { label: '临时 2 小时', value: 'temporary-120' },
]
const rule = computed(() => store.candidate?.rule ?? null)
const evaluation = computed(() => store.candidate?.evaluation ?? null)
const conflicts = computed(() => store.conflicts)
const labeledCount = computed(() => store.labeledCount)
const activeActivation = computed(() => store.active?.activation ?? null)
const activeRuleId = computed(() => field(activeActivation.value, 'RuleVersionID', 'rule_version_id'))
const field = (value, pascal, snake) => value?.[pascal] ?? value?.[snake]

const generate = async () => {
  generating.value = true
  try {
    await store.generateCandidate(props.source)
    message.success('候选规则已根据全部历史标记重新计算')
  } catch (error) { message.error(error.message) } finally { generating.value = false }
}

const publish = async (force) => {
  const ruleId = field(rule.value, 'ID', 'id')
  if (!ruleId) return false
  publishing.value = true
  try {
    const minutes = mode.value === 'temporary-30' ? 30 : mode.value === 'temporary-120' ? 120 : 0
    await store.activate(ruleId, {
      mode: minutes ? 'temporary' : 'permanent',
      expires_at: minutes ? new Date(Date.now() + minutes * 60000).toISOString() : null,
      force,
      reason: force ? forceReason.value.trim() : '',
    })
    showForce.value = false
    forceReason.value = ''
    message.success(minutes ? `新规则已临时应用 ${minutes} 分钟，到期自动恢复` : '新规则已应用')
  } catch (error) { message.error(error.message) } finally { publishing.value = false }
  return false
}

const rollback = async () => {
  const id = field(activeActivation.value, 'ID', 'id')
  if (!id) return false
  try {
    await store.rollback(id, rollbackReason.value.trim())
    showRollback.value = false
    rollbackReason.value = ''
    message.success('已回退到上一条有效规则')
  } catch (error) { message.error(error.message) }
  return false
}
</script>

<style scoped>
.rule-panel { display: grid; gap: 16px; padding: 20px; background: var(--review-panel); border: 1px solid var(--review-border); border-radius: var(--review-radius); box-shadow: var(--review-shadow); }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.section-heading h3 { margin: 3px 0 0; font-size: 17px; line-height: 1.4; }
.eyebrow { color: var(--review-muted); font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.rule-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.rule-summary div { min-height: 72px; padding: 12px 14px; border: 1px solid var(--review-border); border-radius: 12px; background: var(--review-soft); display: grid; align-content: center; gap: 5px; }
.rule-summary span { color: var(--review-muted); font-size: 12px; }
.rule-summary strong { font-size: 16px; font-variant-numeric: tabular-nums; }
.conflict-list { display: grid; gap: 8px; max-height: 220px; overflow: auto; }
.conflict-list button { min-height: 48px; padding: 10px 12px; border: 1px solid var(--review-danger-border); border-radius: 10px; background: var(--review-danger-soft); color: var(--review-danger-text); display: flex; justify-content: space-between; align-items: center; gap: 12px; text-align: left; cursor: pointer; transition: border-color .16s ease, background-color .16s ease; }
.conflict-list button:hover { border-color: var(--review-danger); }
.conflict-list button:focus-visible { outline: 3px solid var(--review-focus); outline-offset: 2px; }
.publish-row { display: grid; grid-template-columns: minmax(180px, 1fr) auto auto; gap: 10px; }
@media (max-width: 700px) {
  .rule-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .publish-row { grid-template-columns: 1fr; }
  .publish-row .n-button { min-height: 44px; }
}
@media (max-width: 430px) {
  .rule-panel { padding: 16px; }
  .section-heading { align-items: stretch; flex-direction: column; }
  .section-heading .n-button { min-height: 44px; }
  .conflict-list button { align-items: flex-start; flex-direction: column; }
}
</style>
