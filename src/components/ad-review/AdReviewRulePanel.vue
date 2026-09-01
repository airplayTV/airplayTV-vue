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
      <div><span>片段数范围</span><strong>{{ segmentRange }}</strong></div>
      <div><span>时长范围</span><strong>{{ durationRange }}</strong></div>
      <div><span>历史广告命中</span><strong>{{ field(evaluation, 'AdMatched', 'ad_matched') || 0 }}</strong></div>
    </div>

    <n-alert v-if="conflictsError" type="warning" title="冲突详情加载失败" :bordered="false">
      候选规则及激活状态已保存，但冲突明细暂时无法读取：{{ conflictsError }}
    </n-alert>

    <n-alert v-if="conflicts.length && !candidateIsActive" type="error" title="发现 CONTENT → AD 冲突" :bordered="false">
      新规则会把 {{ conflicts.length }} 个曾标记为正常内容的分段判为广告。默认禁止发布；请先逐条复核，或填写原因强制发布。
    </n-alert>

    <n-alert v-else-if="conflicts.length" type="warning" title="冲突规则已强制生效" :bordered="false">
      当前规则包含 {{ conflicts.length }} 个 CONTENT → AD 冲突，已按记录原因强制应用。原因：{{ activeReason || '未返回' }}
    </n-alert>

    <div v-if="conflicts.length" class="conflict-list">
      <button v-for="conflict in conflicts" :key="conflict.id" type="button" @click="$emit('review-conflict', conflict)">
        <span>{{ conflict.source }} · {{ conflict.vid }} / {{ conflict.pid }}</span>
        <strong>{{ formatApproxTime(conflict.start_ms) }}–{{ formatApproxTime(conflict.end_ms) }}</strong>
      </button>
    </div>

    <div v-if="rule && conflicts.length && !candidateIsActive" class="publish-row">
      <n-button type="error" secondary :loading="publishing" @click="showForce = true">强制应用</n-button>
    </div>

    <n-modal v-model:show="showForce" preset="dialog" title="强制应用存在冲突的规则" positive-text="确认强制应用" negative-text="取消" :positive-button-props="{ type: 'error', disabled: !forceReason.trim() }" @positive-click="publish">
      <n-input v-model:value="forceReason" type="textarea" placeholder="必填：说明为何接受正常内容被过滤的风险" />
    </n-modal>
    <n-modal v-model:show="showRollback" preset="dialog" title="回退当前规则" positive-text="确认回退" negative-text="取消" :positive-button-props="{ type: 'error', disabled: !rollbackReason.trim() }" @positive-click="rollback">
      <n-input v-model:value="rollbackReason" type="textarea" placeholder="必填：记录本次回退原因" />
    </n-modal>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { NAlert, NButton, NInput, NModal, useMessage } from 'naive-ui'
import { useAdReviewStore } from '@/stores/ad-review.js'
import { formatAdRuleRange, formatApproxTime } from '@/helpers/ad-review-state.js'

const props = defineProps({ source: String })
defineEmits(['review-conflict'])
const store = useAdReviewStore()
const message = useMessage()
const generating = ref(false)
const publishing = ref(false)
const showForce = ref(false)
const forceReason = ref('')
const showRollback = ref(false)
const rollbackReason = ref('')
const rule = computed(() => store.candidate?.rule ?? null)
const evaluation = computed(() => store.candidate?.evaluation ?? null)
const conflicts = computed(() => store.conflicts)
const conflictsError = computed(() => store.conflictsError)
const labeledCount = computed(() => store.labeledCount)
const activeActivation = computed(() => store.active?.activation ?? null)
const activeRuleId = computed(() => field(activeActivation.value, 'RuleVersionID', 'rule_version_id'))
const candidateRuleId = computed(() => field(rule.value, 'ID', 'id'))
const candidateIsActive = computed(() => activeRuleId.value && activeRuleId.value === candidateRuleId.value)
const activeReason = computed(() => field(activeActivation.value, 'Reason', 'reason'))
const field = (value, pascal, snake) => value?.[pascal] ?? value?.[snake]
const segmentRange = computed(() => formatAdRuleRange(
  field(rule.value, 'MinSegment', 'min_segment'),
  field(rule.value, 'MaxSegment', 'max_segment'),
))
const durationRange = computed(() => formatAdRuleRange(
  field(rule.value, 'MinDuration', 'min_duration'),
  field(rule.value, 'MaxDuration', 'max_duration'),
  { digits: 1, suffix: ' 秒' },
))

const generate = async () => {
  generating.value = true
  try {
    const result = await store.generateCandidate(props.source)
    if (result?.activation) message.success('候选规则已生成并立即生效')
    else if (Number(field(result?.evaluation, 'ContentToAd', 'content_to_ad')) > 0) message.warning('候选规则存在 CONTENT → AD 冲突，未自动生效')
    else message.warning('候选规则已生成，但未返回激活记录')
    if (store.conflictsError) message.warning('规则状态已保存，但冲突详情加载失败')
  } catch (error) { message.error(error.message) } finally { generating.value = false }
}

const publish = async () => {
  const ruleId = field(rule.value, 'ID', 'id')
  if (!ruleId) return false
  publishing.value = true
  try {
    await store.activate(ruleId, {
      mode: 'permanent',
      expires_at: null,
      force: true,
      reason: forceReason.value.trim(),
    })
    showForce.value = false
    forceReason.value = ''
    message.success('冲突规则已强制应用')
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
.publish-row { display: flex; justify-content: flex-end; gap: 10px; }
@media (max-width: 700px) {
  .rule-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .publish-row { display: grid; grid-template-columns: 1fr; }
  .publish-row .n-button { min-height: 44px; }
}
@media (max-width: 430px) {
  .rule-panel { padding: 16px; }
  .section-heading { align-items: stretch; flex-direction: column; }
  .section-heading .n-button { min-height: 44px; }
  .conflict-list button { align-items: flex-start; flex-direction: column; }
}
</style>
