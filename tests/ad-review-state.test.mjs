import test from 'node:test'
import assert from 'node:assert/strict'

import {
  AD_REVIEW_MODE_KEY,
	AD_REVIEW_TOKEN_KEY,
	createAdReviewAPIError,
  createAdReviewSession,
	findNextAdReviewBlockId,
  normalizeAdReviewSnapshot,
} from '../src/helpers/ad-review-state.js'

const createStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('广告评审会话只持久化启用标志，不保存密码', () => {
  const storage = createStorage()
  const session = createAdReviewSession(storage)

  session.enable('signed-token')

  assert.equal(session.enabled(), true)
  assert.equal(storage.getItem(AD_REVIEW_MODE_KEY), '1')
  assert.equal(session.token(), 'signed-token')
  assert.equal(storage.getItem(AD_REVIEW_TOKEN_KEY), 'signed-token')
  assert.equal(storage.getItem('password'), null)

  session.disable()
  assert.equal(session.enabled(), false)
  assert.equal(session.token(), '')
})

test('快照响应会被规范化为稳定的前端字段并按分组序号排序', () => {
  const normalized = normalizeAdReviewSnapshot({
    snapshot: { ID: 9, Source: '源A', VID: 'v1', PID: 'p1' },
    blocks: [
      { ID: 12, BlockIndex: 1, StartMS: 10000, EndMS: 20000, SegmentCount: 2, Duration: 10 },
      { ID: 11, BlockIndex: 0, StartMS: 0, EndMS: 10000, SegmentCount: 1, Duration: 10 },
    ],
  })

  assert.equal(normalized.snapshot.id, 9)
  assert.equal(normalized.snapshot.source, '源A')
  assert.deepEqual(normalized.blocks.map((block) => block.id), [11, 12])
  assert.equal(normalized.blocks[0].startMs, 0)
})

test('原项目错误响应中的业务码会保留到前端错误对象', () => {
	const error = createAdReviewAPIError({ code: 404, msg: '当前来源没有生效规则' })

	assert.equal(error.message, '当前来源没有生效规则')
	assert.equal(error.status, 404)
	assert.deepEqual(error.data, { code: 404, msg: '当前来源没有生效规则' })
})

test('标记完成后选择时间线中的下一分段', () => {
	const blocks = [{ id: 11 }, { id: 12 }, { id: 13 }]

	assert.equal(findNextAdReviewBlockId(blocks, 11), 12)
	assert.equal(findNextAdReviewBlockId(blocks, 12), 13)
	assert.equal(findNextAdReviewBlockId(blocks, 13), null)
	assert.equal(findNextAdReviewBlockId(blocks, 999), null)
})
