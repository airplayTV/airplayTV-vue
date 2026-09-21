import assert from 'node:assert/strict'
import test from 'node:test'

import * as iptv from '../src/helpers/iptv.js'
test('扫码后只允许回到站内指定页面', () => {
  assert.equal(typeof iptv.pairingReturnPath, 'function')
  for (const value of [undefined, null, 'https://evil.test', '//evil.test', '/tv?redirect=evil', [' /tv'], '/unknown']) {
    assert.equal(iptv.pairingReturnPath(value), '/?from-join-room')
  }
  assert.equal(iptv.pairingReturnPath('/tv'), '/tv')
})
test('分类、名称搜索与收藏筛选组合生效', () => {
  assert.equal(typeof iptv.filterChannels, 'function')
  const channels = [{id: 'a', name: 'CCTV-1', group: '央视'}, {id: 'b', name: 'CCTV-2', group: '央视'}, {id: 'c', name: '湖南', group: '卫视'}]
  assert.deepEqual(iptv.filterChannels(channels, {keyword: 'cctv', group: '央视', favoritesOnly: true, favorites: ['b']}), [channels[1]])
})
test('直播投射请求保留来源、频道和线路，不带进度', () => {
  assert.equal(typeof iptv.liveCastContext, 'function')
  assert.deepEqual(iptv.liveCastContext({id: 'a', pid: 'ysp-a'}, 'room', 'mode'), {
    event: '/ctl_load_Video', group: 'room', vid: 'a', pid: 'ysp-a', source: '电视源', mode: 'mode',
  })
  assert.equal(iptv.liveCastContext({id: 'a', pid: 'ysp-a'}, 'room', null).mode, '')
})

test('扫码只自动打开同源配对地址，保留受限回跳路径', () => {
  assert.equal(typeof iptv.pairingScanRoute, 'function')
  assert.deepEqual(iptv.pairingScanRoute('https://tv.test/join?room_id=abc', 'https://tv.test', '/tv'), {
    path: '/join', query: {room_id: 'abc', returnTo: '/tv'},
  })
  assert.equal(iptv.pairingScanRoute('https://evil.test/join?room_id=abc', 'https://tv.test', '/tv'), null)
  assert.equal(iptv.pairingScanRoute('https://tv.test/other?room_id=abc', 'https://tv.test', '/tv'), null)
  assert.equal(iptv.pairingScanRoute('not a url', 'https://tv.test', '/tv'), null)
})
