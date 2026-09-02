import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildM3u8ProxyConfig,
  formatM3u8ProxyConfig,
  normalizeAdReviewRuleOverview,
  selectOverviewRule,
} from '../src/helpers/ad-review-rule-overview.js'

const payload = {
  summary: {
    labeled_source_count: 2,
    active_rule_count: 1,
    pending_sync_count: 1,
    without_rule_count: 1,
  },
  items: [
    {
      source: '候选资源',
      statistics: { video_count: 1, snapshot_count: 1, labeled_block_count: 2, label_counts: { AD: 1, CONTENT: 1 } },
      active: null,
      latest_candidate: { id: 9, source: '候选资源', min_segment: 7, max_segment: 7, min_duration: 26, max_duration: 26 },
      static_policy: null,
      effective_kind: 'none',
      sync_status: 'candidate_only',
    },
    {
      source: '非凡资源',
      statistics: { video_count: 12, snapshot_count: 20, labeled_block_count: 86, label_counts: { AD: 19, CONTENT: 67 } },
      active: {
        inherited: false,
        activation: { id: 4, mode: 'permanent', rule_version_id: 4 },
        rule: { id: 4, version: '20260901-123547', source: '非凡资源', min_segment: 0, max_segment: 5, min_duration: 0, max_duration: 19.633334 },
      },
      latest_candidate: null,
      static_policy: null,
      effective_kind: 'active',
      sync_status: 'pending',
    },
    {
      source: '电影天堂资源',
      statistics: null,
      active: null,
      latest_candidate: null,
      static_policy: { mode: 'force', min_segment: 0, max_segment: 5, min_duration: 0, max_duration: 11 },
      effective_kind: 'static',
      sync_status: 'configured_only',
    },
  ],
}

test('规则概览响应归一化并保留统计和候选状态', () => {
  const overview = normalizeAdReviewRuleOverview(payload)

  assert.deepEqual(overview.summary, {
    labeledSourceCount: 2,
    activeRuleCount: 1,
    pendingSyncCount: 1,
    withoutRuleCount: 1,
  })
  assert.equal(overview.items[0].statistics.labelCounts.AD, 1)
  assert.equal(overview.items[0].latestCandidate.maxDuration, 26)
  assert.equal(overview.items[1].active.rule.maxDuration, 19.633334)
})

test('配置导出只包含生效规则和已有静态配置并省略零下限', () => {
  const overview = normalizeAdReviewRuleOverview(payload)

  assert.deepEqual(buildM3u8ProxyConfig(overview.items), {
    m3u8_proxy: {
      '电影天堂资源': {
        mode: 'force',
        max_segment: 5,
        max_duration: 11,
      },
      '非凡资源': {
        mode: 'force',
        max_segment: 5,
        max_duration: 19.633334,
      },
    },
  })
})

test('待同步导出排除候选、继承规则和已同步配置', () => {
  const overview = normalizeAdReviewRuleOverview({
    ...payload,
    items: [
      ...payload.items,
      {
        source: '继承资源',
        active: { inherited: true, activation: { id: 1 }, rule: { id: 1, max_segment: 2, max_duration: 8 } },
        latest_candidate: null,
        static_policy: null,
        effective_kind: 'global',
        sync_status: 'inherited',
      },
    ],
  })

  assert.deepEqual(buildM3u8ProxyConfig(overview.items, { pendingOnly: true }), {
    m3u8_proxy: {
      '非凡资源': {
        mode: 'force',
        max_segment: 5,
        max_duration: 19.633334,
      },
    },
  })
})

test('JSON 格式按来源稳定排序并保留规则数值精度', () => {
  const overview = normalizeAdReviewRuleOverview(payload)
  const formatted = formatM3u8ProxyConfig(buildM3u8ProxyConfig(overview.items))

  assert.equal(formatted, `{
  "m3u8_proxy": {
    "电影天堂资源": {
      "mode": "force",
      "max_segment": 5,
      "max_duration": 11
    },
    "非凡资源": {
      "mode": "force",
      "max_segment": 5,
      "max_duration": 19.633334
    }
  }
}`)
})

test('规则摘要按生效规则、静态配置、候选规则的优先级展示', () => {
  const overview = normalizeAdReviewRuleOverview(payload)

  assert.equal(selectOverviewRule(overview.items[1]).id, 4)
  assert.equal(selectOverviewRule(overview.items[2]).maxDuration, 11)
  assert.equal(selectOverviewRule(overview.items[0]).id, 9)
  assert.equal(selectOverviewRule({}), null)
})
