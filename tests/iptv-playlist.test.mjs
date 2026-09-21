import assert from 'node:assert/strict'
import test from 'node:test'
import * as presentation from '../src/helpers/iptv-presentation.js'

test('channel playlist populates original list fields without confusing channel IDs and stream IDs', () => {
  assert.equal(typeof presentation.channelPlaylist, 'function')
  const channels = [{id: 'cctv1', pid: 'ysp-cctv1', name: 'CCTV1综合', group: '央视'}, {id: 'hnws', pid: 'ysp-hnws', name: '湖南卫视', group: '卫视'}]
  const list = presentation.channelPlaylist(channels)
  assert.deepEqual(list.map(({id, vid, title, artist}) => ({id, vid, title, artist})), [
    {id: 'ysp-cctv1', vid: 'cctv1', title: 'CCTV1综合', artist: '央视'},
    {id: 'ysp-hnws', vid: 'hnws', title: '湖南卫视', artist: '卫视'},
  ])
  assert.equal(list.findIndex(item => item.vid === 'hnws'), 1)
  assert.deepEqual(presentation.channelPlaylist(undefined), [])
})
