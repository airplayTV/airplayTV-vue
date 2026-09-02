const numberValue = (value) => Number(value ?? 0)

const normalizeLabelCounts = (value = {}) => ({
  CONTENT: numberValue(value.CONTENT ?? value.content),
  AD: numberValue(value.AD ?? value.ad),
  UNSURE: numberValue(value.UNSURE ?? value.unsure),
  UNPLAYABLE: numberValue(value.UNPLAYABLE ?? value.unplayable),
})

const normalizeRule = (value) => value ? {
  id: numberValue(value.id ?? value.ID),
  version: String(value.version ?? value.Version ?? ''),
  source: String(value.source ?? value.Source ?? ''),
  minSegment: numberValue(value.min_segment ?? value.MinSegment),
  maxSegment: numberValue(value.max_segment ?? value.MaxSegment),
  minDuration: numberValue(value.min_duration ?? value.MinDuration),
  maxDuration: numberValue(value.max_duration ?? value.MaxDuration),
} : null

const normalizePolicy = (value) => value ? {
  mode: String(value.mode ?? value.Mode ?? ''),
  minSegment: numberValue(value.min_segment ?? value.MinSegment),
  maxSegment: numberValue(value.max_segment ?? value.MaxSegment),
  minDuration: numberValue(value.min_duration ?? value.MinDuration),
  maxDuration: numberValue(value.max_duration ?? value.MaxDuration),
} : null

const normalizeStatistics = (value) => value ? {
  videoCount: numberValue(value.video_count ?? value.VideoCount),
  snapshotCount: numberValue(value.snapshot_count ?? value.SnapshotCount),
  labeledBlockCount: numberValue(value.labeled_block_count ?? value.LabeledBlockCount),
  labelCounts: normalizeLabelCounts(value.label_counts ?? value.LabelCounts),
  latestLabeledAt: value.latest_labeled_at ?? value.LatestLabeledAt ?? null,
} : null

const normalizeActive = (value) => value ? {
  inherited: Boolean(value.inherited ?? value.Inherited),
  activation: value.activation ?? value.Activation ?? null,
  rule: normalizeRule(value.rule ?? value.Rule),
} : null

export const normalizeAdReviewRuleOverview = (value = {}) => {
  const summary = value.summary ?? value.Summary ?? {}
  const items = value.items ?? value.Items ?? []
  return {
    summary: {
      labeledSourceCount: numberValue(summary.labeled_source_count ?? summary.LabeledSourceCount),
      activeRuleCount: numberValue(summary.active_rule_count ?? summary.ActiveRuleCount),
      pendingSyncCount: numberValue(summary.pending_sync_count ?? summary.PendingSyncCount),
      withoutRuleCount: numberValue(summary.without_rule_count ?? summary.WithoutRuleCount),
    },
    items: items.map((item) => ({
      source: String(item.source ?? item.Source ?? ''),
      statistics: normalizeStatistics(item.statistics ?? item.Statistics),
      active: normalizeActive(item.active ?? item.Active),
      latestCandidate: normalizeRule(item.latest_candidate ?? item.LatestCandidate),
      staticPolicy: normalizePolicy(item.static_policy ?? item.StaticPolicy),
      effectiveKind: String(item.effective_kind ?? item.EffectiveKind ?? 'none'),
      syncStatus: String(item.sync_status ?? item.SyncStatus ?? 'none'),
    })),
  }
}

const exportPolicy = (rule) => {
  const policy = { mode: 'force' }
  if (rule.minSegment > 0) policy.min_segment = rule.minSegment
  policy.max_segment = rule.maxSegment
  if (rule.minDuration > 0) policy.min_duration = rule.minDuration
  policy.max_duration = rule.maxDuration
  return policy
}

export const buildM3u8ProxyConfig = (items = [], { pendingOnly = false } = {}) => {
  const policies = {}
  const sorted = [...items].filter((item) => item?.source).sort((left, right) => left.source.localeCompare(right.source, 'zh-CN'))
  for (const item of sorted) {
    const directActiveRule = item.active && !item.active.inherited ? item.active.rule : null
    if (pendingOnly) {
      if (item.syncStatus === 'pending' && directActiveRule) policies[item.source] = exportPolicy(directActiveRule)
      continue
    }
    if (directActiveRule) {
      policies[item.source] = exportPolicy(directActiveRule)
    } else if (item.staticPolicy) {
      policies[item.source] = exportPolicy(item.staticPolicy)
      policies[item.source].mode = item.staticPolicy.mode || 'force'
    }
  }
  return { m3u8_proxy: policies }
}

export const formatM3u8ProxyConfig = (config) => JSON.stringify(config, null, 2)

export const selectOverviewRule = (item) => item?.active?.rule ?? item?.staticPolicy ?? item?.latestCandidate ?? null
