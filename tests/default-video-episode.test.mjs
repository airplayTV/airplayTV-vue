import assert from 'node:assert/strict'
import test from 'node:test'

const episodeModule = await import('../src/helpers/default-video-episode.js').catch(() => ({}))
const resolveDefaultVideoEpisodeId = episodeModule.resolveDefaultVideoEpisodeId
  ?? (async () => undefined)

const links = [
  {id: 'episode-1', name: '第1集'},
  {id: 'episode-2', name: '第2集'},
  {id: 'episode-3', name: '第3集'},
]

test('有效的 URL pid 优先于播放历史', async () => {
  let historyReads = 0
  const result = await resolveDefaultVideoEpisodeId({
    links,
    requestedPid: 'episode-2',
    source: 'ffzy',
    vid: 'video-1',
    findHistoryRecord: async () => {
      historyReads += 1
      return {pid: 'episode-3'}
    },
  })

  assert.equal(result, 'episode-2')
  assert.equal(historyReads, 0)
})

test('未指定 pid 时使用 IndexedDB history 中最近播放的剧集', async () => {
  const result = await resolveDefaultVideoEpisodeId({
    links,
    source: 'ffzy',
    vid: 'video-1',
    findHistoryRecord: async (source, vid) => {
      assert.equal(source, 'ffzy')
      assert.equal(vid, 'video-1')
      return {pid: 'episode-3'}
    },
  })

  assert.equal(result, 'episode-3')
})

test('历史剧集已失效时回退到第一集', async () => {
  const result = await resolveDefaultVideoEpisodeId({
    links,
    source: 'ffzy',
    vid: 'video-1',
    findHistoryRecord: async () => ({pid: 'removed-episode'}),
  })

  assert.equal(result, 'episode-1')
})

test('history 读取失败时不阻断播放', async () => {
  const result = await resolveDefaultVideoEpisodeId({
    links,
    source: 'ffzy',
    vid: 'video-1',
    findHistoryRecord: async () => {
      throw new Error('IndexedDB unavailable')
    },
  })

  assert.equal(result, 'episode-1')
})

test('空剧集列表返回 null', async () => {
  const result = await resolveDefaultVideoEpisodeId({
    links: [],
    source: 'ffzy',
    vid: 'video-1',
    findHistoryRecord: async () => ({pid: 'episode-1'}),
  })

  assert.equal(result, null)
})
