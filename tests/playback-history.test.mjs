import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

const playbackHistoryModule = await import('../src/helpers/playback-history.js').catch(() => ({}))
const dbModule = await import('../src/helpers/db.js').catch(() => ({}))

const normalizePlaybackHistoryUpdate =
  playbackHistoryModule.normalizePlaybackHistoryUpdate ?? (() => null)
const upsertTvPlaybackHistory = dbModule.upsertTvPlaybackHistory ?? (async () => undefined)

const [appSource, historySource] = await Promise.all([
  readFile(new URL('../src/App.vue', import.meta.url), 'utf8'),
  readFile(new URL('../src/views/HistoryView.vue', import.meta.url), 'utf8'),
])

const validPayload = (overrides = {}) => ({
  version: 1,
  room: 'room-a',
  source: 'ffzy',
  vid: 'v1',
  pid: 'p1',
  title: 'Title',
  episode_name: 'Episode 1',
  thumb: 'https://img.test/a.jpg',
  position_ms: 75_000,
  duration_ms: 100_000,
  updated_at: 1_000,
  ...overrides,
})

const normalizedRecord = (overrides = {}) => ({
  source: 'ffzy',
  vid: 'v1',
  pid: 'p1',
  name: 'Title',
  pname: 'Episode 1',
  thumb: 'https://img.test/a.jpg',
  lastTime: 75,
  duration: 100,
  updated_at: 1_000,
  tv_updated_at: 1_000,
  ...overrides,
})

const cloneRows = (rows) => rows.map((row) => ({ ...row }))

const createFakeTable = (name, rows, options = {}) => ({
  name,
  rows,
  where(criteria) {
    return {
      first: async () => this.rows.find((row) =>
        Object.entries(criteria).every(([key, value]) => row[key] === value)),
    }
  },
  async add(record) {
    if (options.failOnAdd) throw new Error(`${name} add failed`)
    const id = this.rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1
    this.rows.push({ ...record, id })
    return id
  },
  async update(id, changes) {
    const index = this.rows.findIndex((row) => row.id === id)
    if (index < 0) return 0
    this.rows[index] = { ...this.rows[index], ...changes }
    return 1
  },
})

const createFakeDb = ({ history = [], timeline = [], failTimelineAdd = false } = {}) => {
  const database = {
    transactionCalls: [],
    history: createFakeTable('history', cloneRows(history)),
    timeline: createFakeTable('timeline', cloneRows(timeline), { failOnAdd: failTimelineAdd }),
    async transaction(mode, historyTable, timelineTable, callback) {
      this.transactionCalls.push([mode, historyTable.name, timelineTable.name])
      const historyBefore = cloneRows(this.history.rows)
      const timelineBefore = cloneRows(this.timeline.rows)
      try {
        return await callback()
      } catch (error) {
        this.history.rows.splice(0, this.history.rows.length, ...historyBefore)
        this.timeline.rows.splice(0, this.timeline.rows.length, ...timelineBefore)
        throw error
      }
    },
  }
  return database
}

test('accepts only version 1 for the current non-empty room', () => {
  assert.equal(normalizePlaybackHistoryUpdate(validPayload(), 'other'), null)
  assert.equal(normalizePlaybackHistoryUpdate(validPayload({ version: 2 }), 'room-a'), null)
  assert.equal(normalizePlaybackHistoryUpdate(validPayload({ room: '' }), ''), null)
  assert.deepEqual(normalizePlaybackHistoryUpdate(validPayload(), 'room-a'), normalizedRecord())
})

test('rejects malformed playback history fields', () => {
  const malformedPayloads = [
    null,
    validPayload({ source: '' }),
    validPayload({ vid: 1 }),
    validPayload({ pid: {} }),
    validPayload({ title: null }),
    validPayload({ position_ms: '75000' }),
    validPayload({ duration_ms: Number.POSITIVE_INFINITY }),
    validPayload({ position_ms: -1 }),
    validPayload({ updated_at: 1.5 }),
    validPayload({ updated_at: Number.MAX_SAFE_INTEGER + 1 }),
  ]

  for (const payload of malformedPayloads) {
    assert.equal(normalizePlaybackHistoryUpdate(payload, 'room-a'), null)
  }
})

test('normalizes unsafe thumbnail URLs to an empty value and caps display text', () => {
  const longTitle = 't'.repeat(300)
  const record = normalizePlaybackHistoryUpdate(validPayload({
    title: longTitle,
    episode_name: longTitle,
    thumb: 'javascript:alert(1)',
  }), 'room-a')

  assert.equal(record.name.length, 256)
  assert.equal(record.pname.length, 256)
  assert.equal(record.thumb, '')
})

test('upserts one record without deleting unrelated history', async () => {
  const fakeDb = createFakeDb({
    history: [{ id: 1, source: 'other', vid: 'keep', lastTime: 12, url: 'keep-url', type: 'hls' }],
  })

  await upsertTvPlaybackHistory(normalizedRecord(), fakeDb)

  assert.deepEqual(fakeDb.transactionCalls, [['rw', 'history', 'timeline']])
  assert.equal(fakeDb.history.rows.length, 2)
  assert.equal(fakeDb.history.rows.find((row) => row.vid === 'keep').lastTime, 12)
  assert.equal(fakeDb.history.rows.find((row) => row.vid === 'v1').lastTime, 75)
  assert.equal(fakeDb.timeline.rows.find((row) => row.pid === 'p1').lastTime, 75)
})

test('preserves existing playback url and type while updating history and timeline', async () => {
  const fakeDb = createFakeDb({
    history: [{
      id: 10,
      ...normalizedRecord({ lastTime: 10, tv_updated_at: 500 }),
      url: 'https://video.test/playlist.m3u8',
      type: 'hls',
    }],
    timeline: [{
      id: 20,
      source: 'ffzy',
      vid: 'v1',
      pid: 'p1',
      lastTime: 10,
      duration: 100,
      updated_at: 500,
      tv_updated_at: 500,
    }],
  })

  await upsertTvPlaybackHistory(normalizedRecord(), fakeDb)

  const history = fakeDb.history.rows[0]
  assert.equal(history.lastTime, 75)
  assert.equal(history.url, 'https://video.test/playlist.m3u8')
  assert.equal(history.type, 'hls')
  assert.equal(fakeDb.timeline.rows[0].lastTime, 75)
})

test('adds new history with empty url and type', async () => {
  const fakeDb = createFakeDb()

  await upsertTvPlaybackHistory(normalizedRecord(), fakeDb)

  assert.equal(fakeDb.history.rows[0].url, '')
  assert.equal(fakeDb.history.rows[0].type, '')
})

test('ignores an update that is not newer than stored TV data', async () => {
  const fakeDb = createFakeDb({
    history: [{
      id: 1,
      ...normalizedRecord({ lastTime: 90, updated_at: 2_000, tv_updated_at: 2_000 }),
      url: 'existing-url',
      type: 'auto',
    }],
    timeline: [],
  })

  const changed = await upsertTvPlaybackHistory(normalizedRecord(), fakeDb)

  assert.equal(changed, false)
  assert.equal(fakeDb.history.rows[0].lastTime, 90)
  assert.equal(fakeDb.timeline.rows.length, 0)
})

test('keeps both stores unchanged when the atomic transaction fails', async () => {
  const fakeDb = createFakeDb({
    history: [{ id: 1, source: 'other', vid: 'keep', lastTime: 12 }],
    failTimelineAdd: true,
  })

  await assert.rejects(upsertTvPlaybackHistory(normalizedRecord(), fakeDb), /timeline add failed/)
  assert.deepEqual(fakeDb.history.rows, [{ id: 1, source: 'other', vid: 'keep', lastTime: 12 }])
  assert.deepEqual(fakeDb.timeline.rows, [])
})

test('routes a room-scoped playback history update through the shared normalizer and upsert', () => {
  assert.match(appSource, /case ['"]playback-history-update['"]:/)
  assert.match(
    appSource,
    /normalizePlaybackHistoryUpdate\(data\.data,\s*getStorageSync\(KEY_ROOM_ID\)\)/,
  )
  assert.match(appSource, /if \(!record\) break/)
  assert.match(
    appSource,
    /upsertTvPlaybackHistory\(record\)\.then\(\(\) => \{[\s\S]*dispatchEvent\(new CustomEvent\(TV_HISTORY_UPDATED_EVENT\)\)[\s\S]*\}\)\.catch/,
  )
})

test('reloads history on TV updates and removes the exact listener on unmount', () => {
  assert.match(historySource, /const loadHistoryList = async \(\) =>/)
  assert.match(
    historySource,
    /addEventListener\(TV_HISTORY_UPDATED_EVENT,\s*loadHistoryList\)/,
  )
  assert.match(
    historySource,
    /removeEventListener\(TV_HISTORY_UPDATED_EVENT,\s*loadHistoryList\)/,
  )
  assert.match(historySource, /onBeforeUnmount\([^)]*onBeforeUnmountHandler[^)]*\)/)
})
