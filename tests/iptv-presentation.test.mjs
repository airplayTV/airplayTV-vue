import assert from 'node:assert/strict'
import test from 'node:test'
import {channelCover, isLiveVideo, tvSearchLocation, videoThumbnail} from '../src/helpers/iptv-presentation.js'

test('channel covers safely encode external names and support every channel group', () => {
  for (const group of ['央视', 'CGTN', '卫视', '', '其他']) {
    const cover = channelCover({name: '<script>&"频道', group})
    const svg = decodeURIComponent(cover.split(',')[1])
    assert.ok(cover.startsWith('data:image/svg+xml;charset=utf-8,'))
    assert.ok(svg.includes('&lt;script&gt;&amp;&quot;频道'))
    assert.ok(!svg.includes('<script>'))
  }
  assert.equal(videoThumbnail({media_kind: 'live', name: 'CCTV-1'}), channelCover({media_kind: 'live', name: 'CCTV-1'}))
  assert.equal(videoThumbnail({thumb: '/poster.jpg', media_kind: 'live'}), '/poster.jpg')
})

test('live dispatch accepts semantic kind and explicit IPTV type without changing VOD', () => {
  assert.equal(isLiveVideo({type: 'video', media_kind: 'live'}), true)
  assert.equal(isLiveVideo({type: 'iptv'}), true)
  for (const video of [undefined, {}, {type: 'video'}, {type: 'mp3'}]) assert.equal(isLiveVideo(video), false)
})

test('TV search preserves group, clears keyword and never leaks into VOD search', () => {
  assert.deepEqual(tvSearchLocation({group: '央视'}, ' cctv '), {path: '/tv', query: {group: '央视', keyword: 'cctv'}})
  assert.equal(tvSearchLocation({keyword: 'old'}, null).query.keyword, undefined)
})
