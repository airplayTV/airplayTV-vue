import test from 'node:test'
import assert from 'node:assert/strict'

import {
  adReviewAccessAction,
  buildAdReviewCalibrationRoute,
  consumeAdReviewAutostartQuery,
  createAdReviewSingleFlight,
  normalizeAdReviewHistoryFilter,
  normalizeAdReviewHistoryPage,
  normalizeAdReviewSnapshotDetail,
  shouldShowAdReviewHistory,
} from '../src/helpers/ad-review-history.js'

test('广告标记受保护页面按会话状态决定展示恢复或登录', () => {
  assert.equal(adReviewAccessAction({ authenticated: true, enabled: true, restoring: false }), 'show')
  assert.equal(adReviewAccessAction({ authenticated: false, enabled: true, restoring: true }), 'loading')
  assert.equal(adReviewAccessAction({ authenticated: false, enabled: true, restoring: false }), 'restore')
  assert.equal(adReviewAccessAction({ authenticated: false, enabled: false, restoring: false }), 'login')
})

test('广告标记历史菜单只在模式开启且服务端会话有效时显示', () => {
  assert.equal(shouldShowAdReviewHistory(true, true), true)
  assert.equal(shouldShowAdReviewHistory(true, false), false)
  assert.equal(shouldShowAdReviewHistory(false, true), false)
  assert.equal(shouldShowAdReviewHistory(false, false), false)
})

test('并发会话恢复复用同一个请求并在结束后允许重试', async () => {
  const runSingleFlight = createAdReviewSingleFlight()
  let calls = 0
  const task = async () => {
    calls += 1
    await Promise.resolve()
    return calls
  }

  const first = runSingleFlight(task)
  const second = runSingleFlight(task)
  assert.equal(first, second)
  assert.equal(await first, 1)
  assert.equal(await runSingleFlight(task), 2)
  assert.equal(calls, 2)
})

test('重新校准使用路由对象保留源视频和剧集标识', () => {
  assert.deepEqual(buildAdReviewCalibrationRoute({ source: '源 A', vid: 'v/1', pid: '2' }), {
    name: 'VideoDetail',
    params: { id: 'v/1' },
    query: { _source: '源 A', pid: '2', ad_review_autostart: '1' },
  })
})

test('广告标记历史响应归一化并按最近标记时间排列快照', () => {
  const normalized = normalizeAdReviewHistoryPage({
    Items: [{
      Source: 'source-a',
      VID: 'v1',
      VideoName: '示例视频',
      LatestLabeledAt: '2026-08-27T08:10:00Z',
      SnapshotCount: 2,
      EpisodeCount: 1,
      LabelCounts: { CONTENT: 1, AD: 2, UNSURE: 0, UNPLAYABLE: 0 },
      Episodes: [{
        PID: 'p1',
        LatestSnapshotID: 12,
        SnapshotCount: 2,
        LatestLabeledAt: '2026-08-27T08:10:00Z',
        LabelCounts: { CONTENT: 1, AD: 2, UNSURE: 0, UNPLAYABLE: 0 },
        Snapshots: [
          { ID: 11, CreatedAt: '2026-08-27T08:00:00Z', LatestLabeledAt: '2026-08-27T08:05:00Z', LabeledBlockCount: 1, LabelCounts: { CONTENT: 1 } },
          { ID: 12, CreatedAt: '2026-08-27T08:06:00Z', LatestLabeledAt: '2026-08-27T08:10:00Z', LabeledBlockCount: 2, LabelCounts: { AD: 2 } },
        ],
      }],
    }],
    Total: 1,
    Page: 1,
    PageSize: 20,
  })

  assert.equal(normalized.total, 1)
  assert.equal(normalized.pageSize, 20)
  assert.equal(normalized.items[0].videoName, '示例视频')
  assert.deepEqual(normalized.items[0].labelCounts, { CONTENT: 1, AD: 2, UNSURE: 0, UNPLAYABLE: 0 })
  assert.deepEqual(normalized.items[0].episodes[0].snapshots.map((snapshot) => snapshot.id), [12, 11])
  assert.equal(normalized.items[0].episodes[0].snapshots[0].labeledBlockCount, 2)
})

test('广告标记历史筛选会清理文本并限制分页范围', () => {
  assert.deepEqual(normalizeAdReviewHistoryFilter({
    keyword: '  abc ', source: ' source-a ', page: -2, pageSize: 1000,
  }), {
    keyword: 'abc', source: 'source-a', page: 1, page_size: 100,
  })
  assert.deepEqual(normalizeAdReviewHistoryFilter({}), {
    keyword: '', source: '', page: 1, page_size: 20,
  })
})

test('历史快照详情按分段序号排序并保留当前标签', () => {
  const detail = normalizeAdReviewSnapshotDetail({
    snapshot: { ID: 3, Source: 'source-a', VID: 'v1', PID: 'p1', VideoName: '示例视频' },
    blocks: [
      { ID: 2, BlockIndex: 1, StartMS: 6000, EndMS: 12000, LabelEvent: null },
      { ID: 1, BlockIndex: 0, StartMS: 0, EndMS: 6000, LabelEvent: { ID: 9, Label: 'AD' } },
    ],
  })

  assert.equal(detail.snapshot.id, 3)
  assert.equal(detail.snapshot.videoName, '示例视频')
  assert.deepEqual(detail.blocks.map((block) => block.id), [1, 2])
  assert.equal(detail.blocks[0].labelEvent.label, 'AD')
  assert.equal(detail.blocks[1].labelEvent, null)
})

test('自动重新校准参数只消费一次并保留其他查询条件', () => {
  const result = consumeAdReviewAutostartQuery({
    _source: 'source-a', pid: 'p1', ad_review_autostart: '1', keyword: 'keep',
  })
  assert.equal(result.shouldStart, true)
  assert.deepEqual(result.nextQuery, { _source: 'source-a', pid: 'p1', keyword: 'keep' })
  assert.equal(consumeAdReviewAutostartQuery({ pid: 'p1' }).shouldStart, false)
})
