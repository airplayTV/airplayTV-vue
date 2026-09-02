import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { formatVideoSourceOptions } from '../src/helpers/video-source-options.js'

const historyViewSource = readFileSync(new URL('../src/views/AdReviewHistoryView.vue', import.meta.url), 'utf8')

import {
  adReviewAccessAction,
  adReviewPreviewFallbackMode,
  buildAdReviewCalibrationRoute,
  buildAdReviewHistoryListRoute,
  buildAdReviewHistoryRouteQuery,
  createAdReviewSingleFlight,
  isAdReviewAuthenticationError,
  normalizeAdReviewPreviewMode,
  normalizeAdReviewHistoryFilter,
  normalizeAdReviewHistoryRouteQuery,
  normalizeAdReviewHistoryPage,
  normalizeAdReviewSnapshotDetail,
  runAdReviewSnapshotDeletion,
  runAdReviewSourceDeletion,
  runAdReviewVideoDeletion,
  shouldShowAdReviewHistory,
} from '../src/helpers/ad-review-history.js'

test('来源规则跳转到独立历史页并通过查询参数保留来源', () => {
  assert.deepEqual(buildAdReviewHistoryListRoute(' 非凡资源 '), {
    name: 'AdReviewHistoryList',
    query: { source: '非凡资源' },
  })
})

test('历史页路由查询归一化并在清除来源后移除空参数', () => {
  assert.deepEqual(normalizeAdReviewHistoryRouteQuery({ source: ' 来源 A ', keyword: ' v1 ', page: '3' }), {
    source: '来源 A', keyword: 'v1', page: 3,
  })
  assert.deepEqual(buildAdReviewHistoryRouteQuery({ source: '', keyword: '', page: 1 }), {})
  assert.deepEqual(buildAdReviewHistoryRouteQuery({ source: '来源 A', keyword: 'v1', page: 2 }), {
    source: '来源 A', keyword: 'v1', page: '2',
  })
})

test('独立历史页提供不依赖下拉状态的显式来源清除操作', () => {
  assert.match(historyViewSource, /aria-label="清除来源筛选"/)
  assert.match(historyViewSource, /@click="changeSource\(''\)"/)
})

test('来源列表按设置页格式生成可筛选选项', () => {
  const sourceList = [
    { id: 'source-a', name: '来源 A', tags: [{ name: '电影', value: 'movie' }] },
    { id: 27, name: '来源 B', tags: [] },
  ]

  assert.deepEqual(formatVideoSourceOptions(sourceList), [
    { label: '(1) 来源 A [source-a]', value: '来源 A', data: sourceList[0] },
    { label: '(2) 来源 B [27]', value: '来源 B', data: sourceList[1] },
  ])
})

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

test('重新校准使用唯一运行标识强制重新解析', () => {
  assert.deepEqual(buildAdReviewCalibrationRoute({ source: '源 A', vid: 'v/1', pid: '2', runId: 'run-2' }), {
    name: 'VideoDetail',
    params: { id: 'v/1' },
    query: { _source: '源 A', pid: '2', ad_review_run: 'run-2' },
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

test('分段预览默认直连且仅在直连失败时可切换代理', () => {
  assert.equal(normalizeAdReviewPreviewMode(), 'direct')
  assert.equal(normalizeAdReviewPreviewMode('unexpected'), 'direct')
  assert.equal(normalizeAdReviewPreviewMode('proxy'), 'proxy')
  assert.equal(adReviewPreviewFallbackMode('direct'), 'proxy')
  assert.equal(adReviewPreviewFallbackMode('proxy'), null)
})

test('广告标记接口同时识别 HTTP 与业务响应中的认证过期', () => {
  assert.equal(isAdReviewAuthenticationError({ status: 401 }), true)
  assert.equal(isAdReviewAuthenticationError({ data: { code: 401 } }), true)
  assert.equal(isAdReviewAuthenticationError({ status: 404, data: { code: 404 } }), false)
})

test('永久删除快照成功后才刷新当前广告标记列表', async () => {
  const calls = []
  const result = await runAdReviewSnapshotDeletion(12, {
    deleteSnapshot: async (snapshotId) => {
      calls.push(`delete:${snapshotId}`)
      return { snapshot_id: snapshotId }
    },
    reloadHistory: async () => {
      calls.push('reload')
      return { total: 1 }
    },
  })

  assert.deepEqual(calls, ['delete:12', 'reload'])
  assert.deepEqual(result, { snapshot_id: 12 })
})

test('永久删除快照失败时保留当前列表且不触发刷新', async () => {
  let reloaded = false
  await assert.rejects(() => runAdReviewSnapshotDeletion(12, {
    deleteSnapshot: async () => { throw new Error('delete failed') },
    reloadHistory: async () => { reloaded = true },
  }), /delete failed/)
  assert.equal(reloaded, false)
})

test('删除来源成功后才刷新规则概览', async () => {
  const calls = []
  const result = await runAdReviewSourceDeletion('来源 A', {
    deleteSource: async (source) => { calls.push(`delete:${source}`); return { snapshot_count: 3 } },
    reloadOverview: async () => { calls.push('reload') },
  })
  assert.deepEqual(result, { snapshot_count: 3 })
  assert.deepEqual(calls, ['delete:来源 A', 'reload'])
})

test('删除视频失败时保留当前列表且不触发刷新', async () => {
  let reloaded = false
  await assert.rejects(() => runAdReviewVideoDeletion({ source: '来源 A', vid: 'v1' }, {
    deleteVideo: async () => { throw new Error('delete failed') },
    reloadHistory: async () => { reloaded = true },
  }), /delete failed/)
  assert.equal(reloaded, false)
})
