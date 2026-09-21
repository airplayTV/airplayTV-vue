import assert from 'node:assert/strict'
import test from 'node:test'
import * as playback from '../src/helpers/iptv-playback.js'

const video = {id: 'cctv1', name: 'CCTV-1 综合', media_kind: 'live', links: [{id: 'ysp-cctv1', name: '高清'}], channels: [{id: 'cctv1', name: 'CCTV-1 综合', pid: 'ysp-cctv1'}]}

test('未加入房间或本机作为接收端时加载网页源，不发送投屏', async () => {
  for (const room of [null, '', 'self']) {
    const calls = []
    const result = await playback.startLivePlayback({
      video, room, clientId: 'self',
      loadSource: async (...args) => { calls.push(args); return {data: {type: 'hls', url: 'https://api.test/api/iptv/live/cctv1.m3u8'}} },
      sendControl: () => assert.fail('must not cast'),
      navigate: () => assert.fail('must not navigate'),
    })
    assert.deepEqual(calls, [['cctv1', 'ysp-cctv1', '电视源']])
    assert.equal(result.url, 'https://api.test/api/iptv/live/cctv1.m3u8')
    assert.equal(result.proxyUrl, 'https://api.test/api/iptv/live/cctv1.m3u8?web=1')
  }
})

test('已加入房间等待ACK并保存直播会话后才进入遥控器，不请求本地播放源', async () => {
  const calls = []
  let ack
  const pending = playback.startLivePlayback({
    video, room: 'tv-room', clientId: 'self', mode: 'm',
    loadSource: () => assert.fail('must not load local stream'),
    sendControl: (room, context) => {
      assert.equal(room, 'tv-room')
      assert.deepEqual(context, {event: '/ctl_load_Video', group: 'tv-room', vid: 'cctv1', pid: 'ysp-cctv1', source: '电视源', mode: 'm'})
      calls.push('send')
      return new Promise(resolve => { ack = resolve })
    },
    saveSession: session => { assert.equal(session.media_kind, 'live'); assert.equal(session.channels[0].id, 'cctv1'); calls.push('save'); return session },
    navigate: path => calls.push(path),
  })
  assert.deepEqual(calls, ['send'])
  ack()
  assert.equal(await pending, null)
  assert.deepEqual(calls, ['send', 'save', '/control'])
})

test('投屏失败保持当前页面，不偷偷改为本地播放', async () => {
  await assert.rejects(playback.startLivePlayback({
    video, room: 'tv-room', clientId: 'self',
    sendControl: async () => { throw new Error('offline') },
    loadSource: () => assert.fail('must not fall back'),
    navigate: () => assert.fail('must not navigate'),
  }), /offline/)
})

test('离开页面后迟到的ACK不跳转遥控器', async () => {
  let active = true
  let ack
  const pending = playback.startLivePlayback({
    video, room: 'tv-room', clientId: 'self', isCurrent: () => active,
    sendControl: () => new Promise(resolve => { ack = resolve }),
    saveSession: () => assert.fail('stale session persistence'),
    navigate: () => assert.fail('stale navigation'),
  })
  active = false
  ack()
  await pending
})

test('非法线路不发送投屏；网页源错误不构造播放器', async () => {
  await assert.rejects(playback.startLivePlayback({video, pid: 'bad', room: 'tv', sendControl: () => assert.fail('invalid line')}), /线路/)
  await assert.rejects(playback.startLivePlayback({video, loadSource: async () => ({data: {url: '', type: 'hls'}})}), /直播源/)
})
