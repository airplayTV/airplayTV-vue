import assert from 'node:assert/strict'
import test from 'node:test'
import * as presentation from '../src/helpers/iptv-presentation.js'
const {channelCover, isLiveVideo, tvSearchLocation, videoThumbnail} = presentation

test('直播投屏信息按当前频道补封面，切台不沿用旧图，点播保留原封面', () => {
  const thumbnail = presentation.castSessionThumbnail
  assert.equal(typeof thumbnail, 'function')
  const session = {media_kind: 'live', vid: 'a', title: 'CCTV1综合', thumb: 'old-cover',
    channels: [{id: 'a', name: 'CCTV1综合', group: '央视'}, {id: 'b', name: '湖南卫视', group: '卫视'}]}
  assert.equal(thumbnail(session), channelCover(session.channels[0]))
  assert.equal(thumbnail({...session, vid: 'b', title: '湖南卫视'}), channelCover(session.channels[1]))
  assert.equal(thumbnail({media_kind: 'live', title: 'CCTV1综合'}), channelCover({name: 'CCTV1综合'}))
  assert.equal(thumbnail({thumb: '/poster.jpg'}), '/poster.jpg')
  assert.equal(thumbnail(null), '')
})

const coverText = channel => [...decodeURIComponent(channelCover(channel).split(',')[1])
  .matchAll(/>([^<>]+)</g)].map(match => match[1])

test('portrait identities separate CCTV numbers and programme categories without dropping suffixes', () => {
  for (const [name, number, category] of [
    ['CCTV1综合', '1', '综合'], ['CCTV-13 新闻', '13', '新闻'], ['CCTV5+体育赛事', '5+', '体育赛事'],
  ]) {
    const text = coverText({name, group: '央视'})
    for (const value of ['CCTV', number, category]) assert.ok(text.includes(value), `${name}: missing ${value}`)
  }
})

test('portrait identities retain CGTN languages and satellite channel names', () => {
  for (const [name, parts] of [
    ['CGTN阿拉伯语', ['CGTN', '阿拉伯语']], ['湖南卫视', ['湖南', '卫视']],
    ['北京纪实科教', ['北京纪实科教']],
  ]) {
    const text = coverText({name})
    for (const part of parts) assert.ok(text.includes(part), `${name}: missing ${part}`)
  }
})

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
