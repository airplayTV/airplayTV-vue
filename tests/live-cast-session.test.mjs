import assert from 'node:assert/strict'
import test from 'node:test'
import * as sessions from '../src/helpers/cast-session.js'

const channels = [{id: 'a', name: '一台', group: '央视', pid: 'ysp-a'}, {id: 'b', name: '二台', group: '央视', pid: 'ysp-b'}]
const candidate = () => sessions.buildCastSessionCandidate({room: 'room', source: '电视源', video: {
  id: 'a', name: '一台', media_kind: 'live', channels,
  links: [{id: 'ysp-a', name: '高清'}, {id: 'backup-a', name: '备用'}],
}, current: {id: 'ysp-a', name: '高清'}})

test('直播保留独立频道目录，不把本频道线路当剧集', () => {
  const session = sessions.normalizeCastSession(candidate())
  assert.equal(session.media_kind, 'live')
  assert.deepEqual(session.channels, channels)
  assert.deepEqual(session.episodes, [])
  assert.equal(sessions.shouldShowEpisodeSwitcher(session), false)
  assert.equal(sessions.updateCastSessionEpisode(session, {id: 'backup-a'}), null)
})

test('上下台按频道顺序循环，同时修改 vid 和 pid', () => {
  assert.equal(typeof sessions.adjacentCastChannel, 'function')
  const original = sessions.normalizeCastSession(candidate())
  const next = sessions.adjacentCastChannel(original, 1)
  assert.deepEqual(next, channels[1])
  const updated = sessions.updateCastSessionChannel(original, next.id)
  assert.equal(updated.vid, 'b')
  assert.equal(updated.pid, 'ysp-b')
  assert.equal(updated.title, '二台')
  assert.equal(original.vid, 'a')
  assert.deepEqual(sessions.adjacentCastChannel(updated, 1), channels[0])
  assert.equal(sessions.updateCastSessionChannel(original, 'missing'), null)
})

test('直播目录归一化去重且不保存播放地址或鉴权信息', () => {
  const session = sessions.normalizeCastSession({...candidate(), channels: [
    {...channels[0], url: 'secret', token: 'secret'}, channels[0], null, {id: 'c', name: '三台'}, channels[1],
  ]})
  assert.deepEqual(session.channels, channels)
})

test('直播 Detail 没有封面时仍可构造可持久化的投射会话', () => {
  const snapshot = sessions.buildCastSessionCandidate({room: 'room', source: '电视源',
    video: {id: 'a', name: '一台', thumb: '', media_kind: 'live', channels}, current: {id: 'ysp-a', name: '高清'}})
  assert.equal(sessions.normalizeCastSession(snapshot)?.media_kind, 'live')
})
