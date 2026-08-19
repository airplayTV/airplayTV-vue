import assert from 'node:assert/strict'
import test from 'node:test'

import * as castSessionHelpers from '../src/helpers/cast-session.js'

const {
  buildCastSessionCandidate,
  CAST_SESSION_VERSION,
  findCastEpisode,
  loadCastSession,
  normalizeCastSession,
  saveCastSession,
  shouldShowEpisodeSwitcher,
  updateCastSessionEpisode,
} = castSessionHelpers
import {KEY_CAST_SESSION} from '../src/helpers/constant.js'

const session = (overrides = {}) => ({
  version: CAST_SESSION_VERSION,
  room: ' room-a ',
  vid: ' video-a ',
  pid: ' episode-a ',
  source: ' source-a ',
  title: ' Example title ',
  thumb: ' https://example.test/thumb.jpg ',
  episodeName: ' Episode A ',
  episodes: [
    {id: 'episode-a', name: 'Episode A', url: 'https://secret.test/video.m3u8'},
    {id: 'episode-b', name: 'Episode B', headers: {authorization: 'secret'}},
  ],
  updatedAt: 10,
  mode: 'private-mode',
  playbackUrl: 'https://secret.test/playback',
  headers: {authorization: 'secret'},
  rawResponse: {token: 'secret'},
  unexpected: true,
  ...overrides,
})

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  }
}

test('builds cast metadata with episode title fallbacks and no sensitive fields', () => {
  const actual = buildCastSessionCandidate({
    room: 'room-a',
    video: {
      id: 'video-a',
      name: 'Series title',
      thumb: 'https://example.test/thumb.jpg',
      links: [
        {id: 'episode-a', name: 'Episode A', url: 'https://secret.test/a.m3u8'},
        {id: 'episode-b', title: 'Episode B', headers: {authorization: 'secret'}},
      ],
      mode: 'private-mode',
      playbackUrl: 'https://secret.test/playback',
    },
    current: {id: 'episode-b', title: 'Current episode title', url: 'https://secret.test/current.m3u8'},
    source: 'source-a',
  })

  assert.deepEqual(actual, {
    room: 'room-a',
    vid: 'video-a',
    pid: 'episode-b',
    source: 'source-a',
    title: 'Series title',
    thumb: 'https://example.test/thumb.jpg',
    episodeName: 'Current episode title',
    episodes: [
      {id: 'episode-a', name: 'Episode A'},
      {id: 'episode-b', name: 'Episode B'},
    ],
  })
  assert.equal('mode' in actual, false)
  assert.equal('playbackUrl' in actual, false)
  assert.equal('headers' in actual, false)
  assert.equal('url' in actual, false)
  assert.equal('current' in actual, false)
})

test('normalizes a versioned cast session with trimmed safe fields only', () => {
  const actual = normalizeCastSession(session())
  assert.deepEqual(actual, {
    version: 1,
    room: 'room-a',
    vid: 'video-a',
    pid: 'episode-a',
    source: 'source-a',
    title: 'Example title',
    thumb: 'https://example.test/thumb.jpg',
    episodeName: 'Episode A',
    episodes: [
      {id: 'episode-a', name: 'Episode A'},
      {id: 'episode-b', name: 'Episode B'},
    ],
    updatedAt: 10,
  })
  assert.deepEqual(Object.keys(actual).sort(), [
    'episodeName', 'episodes', 'pid', 'room', 'source', 'thumb', 'title', 'updatedAt', 'version', 'vid',
  ])
})

test('rejects invalid required identifiers and field limits', () => {
  for (const field of ['room', 'vid', 'pid', 'source']) {
    assert.equal(normalizeCastSession(session({[field]: '  '})), null)
    assert.equal(normalizeCastSession(session({[field]: 1})), null)
    assert.equal(normalizeCastSession(session({[field]: 'x'.repeat(257)})), null)
  }
  assert.equal(normalizeCastSession(session({title: 'x'.repeat(513)})), null)
  assert.equal(normalizeCastSession(session({episodeName: 'x'.repeat(513)})), null)
  assert.equal(normalizeCastSession(session({thumb: 'x'.repeat(2049)})), null)
})

test('accepts only non-negative safe-integer timestamps', () => {
  assert.equal(
    normalizeCastSession(session({updatedAt: Number.MAX_SAFE_INTEGER - 1})).updatedAt,
    Number.MAX_SAFE_INTEGER - 1,
  )
  assert.equal(
    normalizeCastSession(session({updatedAt: Number.MAX_SAFE_INTEGER})).updatedAt,
    Number.MAX_SAFE_INTEGER,
  )

  const before = Date.now()
  for (const updatedAt of [
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    Number.MAX_VALUE,
    Infinity,
  ]) {
    const normalized = normalizeCastSession(session({updatedAt}))
    assert.ok(normalized.updatedAt >= before)
    assert.ok(normalized.updatedAt <= Number.MAX_SAFE_INTEGER)
    assert.ok(Number.isSafeInteger(normalized.updatedAt))
  }
})

test('filters malformed episodes and caps safe episodes at 500', () => {
  const episodes = Array.from({length: 501}, (_, index) => ({
    id: `episode-${index}`,
    name: `Episode ${index}`,
    url: 'https://secret.test/video.m3u8',
  }))
  episodes.push({id: '', name: 'invalid'}, null, {id: 'valid', name: 'x'.repeat(513)})
  const actual = normalizeCastSession(session({episodes}))
  assert.equal(actual.episodes.length, 500)
  assert.deepEqual(actual.episodes[0], {id: 'episode-0', name: 'Episode 0'})
  assert.deepEqual(actual.episodes.at(-1), {id: 'episode-499', name: 'Episode 499'})
})

test('load rejects bad JSON, unknown versions, invalid fields, and mismatched rooms', () => {
  for (const value of [
    '{bad json',
    JSON.stringify(session({version: 2})),
    JSON.stringify(session({vid: ''})),
    JSON.stringify(session({room: 'other-room'})),
  ]) {
    assert.equal(loadCastSession('room-a', createStorage({[KEY_CAST_SESSION]: value})), null)
  }
  assert.equal(loadCastSession('room-a', {getItem: () => { throw new Error('blocked') }}), null)
})

test('save and load preserve only the whitelist and reject storage failures', () => {
  const storage = createStorage()
  const saved = saveCastSession(session(), storage)
  assert.equal(saved.room, 'room-a')
  const persisted = JSON.parse(storage.values.get(KEY_CAST_SESSION))
  assert.deepEqual(persisted, saved)
  assert.equal('mode' in persisted, false)
  assert.equal('playbackUrl' in persisted, false)
  assert.equal('headers' in persisted, false)
  assert.equal('rawResponse' in persisted, false)
  assert.deepEqual(loadCastSession('room-a', storage), saved)
  assert.equal(saveCastSession(session(), {setItem: () => { throw new Error('quota') }}), null)
})

test('updates an immutable snapshot using the matching safe episode name and a strictly newer timestamp', () => {
  const original = normalizeCastSession(session({updatedAt: Date.now() + 1_000}))
  const actual = updateCastSessionEpisode(original, {id: 'episode-b', name: 'ignored', mode: 'secret'})
  assert.notEqual(actual, original)
  assert.equal(original.pid, 'episode-a')
  assert.equal(original.episodeName, 'Episode A')
  assert.equal(actual.pid, 'episode-b')
  assert.equal(actual.episodeName, 'Episode B')
  assert.ok(actual.updatedAt > original.updatedAt)
  assert.equal('mode' in actual, false)
})

test('updates the maximum predecessor to the maximum safe timestamp', () => {
  const original = normalizeCastSession(session({updatedAt: Number.MAX_SAFE_INTEGER - 1}))
  const actual = updateCastSessionEpisode(original, {id: 'episode-b'})
  assert.equal(actual.updatedAt, Number.MAX_SAFE_INTEGER)
  assert.ok(actual.updatedAt > original.updatedAt)
})

test('rejects an episode update at the maximum safe timestamp', () => {
  const original = normalizeCastSession(session({updatedAt: Number.MAX_SAFE_INTEGER}))
  assert.throws(
    () => updateCastSessionEpisode(original, {id: 'episode-b'}),
    /invalid cast session timestamp/,
  )
})

test('finds only a valid episode belonging to the session', () => {
  assert.equal(typeof findCastEpisode, 'function')
  const snapshot = session({
    episodes: [
      null,
      {id: '', name: 'invalid'},
      {id: 'episode-a', name: 'Episode A', url: 'https://secret.test/a.m3u8'},
    ],
  })

  assert.deepEqual(findCastEpisode(snapshot, ' episode-a '), {id: 'episode-a', name: 'Episode A'})
  assert.equal(findCastEpisode(snapshot, 'missing'), null)
  assert.equal(findCastEpisode(null, 'episode-a'), null)
})

test('shows the episode switcher only for more than one valid episode', () => {
  assert.equal(typeof shouldShowEpisodeSwitcher, 'function')
  assert.equal(shouldShowEpisodeSwitcher(session({episodes: []})), false)
  assert.equal(shouldShowEpisodeSwitcher(session({
    episodes: [{id: 'episode-a', name: 'Episode A'}],
  })), false)
  assert.equal(shouldShowEpisodeSwitcher(session({
    episodes: [
      {id: '', name: 'invalid'},
      {id: 'episode-a', name: 'Episode A'},
      {id: 'episode-b', name: 'Episode B'},
    ],
  })), true)
})
