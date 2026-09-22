import assert from 'node:assert/strict'
import test from 'node:test'
import {readFile} from 'node:fs/promises'
import * as vue from 'vue'
import * as preference from '../src/helpers/player-preference.js'
import * as delivery from '../src/helpers/iptv-delivery.js'
import * as sessions from '../src/helpers/cast-session.js'
import {castSessionThumbnail} from '../src/helpers/iptv-presentation.js'
import * as websocket from '../src/helpers/websocket.js'
import {sendControlCommand} from '../src/helpers/casting.js'
import {createCastingCommandGuard} from '../src/helpers/casting.js'
import {createLatestOperationGuard} from '../src/helpers/player-session.js'
import {channelPlaylist, isLiveVideo} from '../src/helpers/iptv-presentation.js'

// Run the actual setup handlers. Only DOM/media engines and network boundaries are replaced.
async function setup(path, dependencies, bindings) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const script = source.split('<script setup>')[1].split('</script>')[0]
    .replace(/^import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
  const scope = {ref: vue.ref, shallowRef: vue.shallowRef, computed: vue.computed, nextTick: vue.nextTick,
    onBeforeUnmount() {},
    ...websocket, castSessionThumbnail, uuidv4: () => 'live-control-test', ...dependencies}
  return new Function(...Object.keys(scope), `${script}\nreturn {${bindings}}`)(...Object.values(scope))
}

async function setupLivePlaylist(pid) {
  const navigations = []
  const app = await setup('../src/components/AppPlayVideo.vue', {
    ...preference, channelPlaylist, isLiveVideo, createCastingCommandGuard, createLatestOperationGuard,
    defineProps: () => ({video: {id: 'a', media_kind: 'live',
      links: [{id: 'a1', name: '线路一'}, {id: 'a2', name: '线路二'}],
      channels: [{id: 'a', pid: 'a1', name: '一台'}, {id: 'b', pid: 'b1', name: '二台'}]}}),
    useRoute: () => ({path: '/video/detail/a', query: {_source: '电视源', pid, custom: 'keep'}}),
    useRouter: () => ({push: async target => navigations.push(target)}),
    useAppStore: () => ({}), useMessage: () => ({}), useLoadingBar: () => ({}),
    KEY_VIDEO_PLAYER: 'player', KEY_ROOM_ID: 'room', KEY_CLIENT_ID: 'client', IPTV_SOURCE: '电视源',
    getStorageSync: () => null, onBeforeMount() {}, onBeforeUnmount() {},
    window: {innerWidth: 1024, addEventListener() {}},
  }, 'onBeforeMountHandler, onChangePlaying, onChangeLiveChannel, playList, playIndex')
  await app.onBeforeMountHandler()
  return {app, navigations}
}

test('直播播放列表展示当前频道线路，按 pid 高亮并在当前页面切换线路', async () => {
  const {app, navigations} = await setupLivePlaylist('a2')
  assert.deepEqual(app.playList.value.map(item => [item.id, item.title]), [['a1', '线路一'], ['a2', '线路二']])
  assert.equal(app.playIndex.value, 1)
  await app.onChangePlaying(0)
  assert.deepEqual(navigations, [{path: '/video/detail/a', query: {_source: '电视源', pid: 'a1', custom: 'keep'}}])
})

test('直播默认选中首条线路，下一台仍按频道列表切换', async () => {
  const {app, navigations} = await setupLivePlaylist()
  assert.equal(app.playIndex.value, 0)
  await app.onChangeLiveChannel(1)
  assert.deepEqual(navigations, [{path: '/video/detail/b', query: {_source: '电视源', pid: 'b1'}}])
})

for (const type of [1, 2, 4]) {
  test(`网页直播播放器 ${type} 接收暂停和播放，卸载后停止处理遥控`, async () => {
    const mounted = [], disposed = []
    let handler, registeredKey, removedKey
    let pauses = 0, plays = 0
    const app = await setup('../src/components/AppPlayLive.vue', {
      ...preference, ...delivery,
      defineProps: () => ({video: {links: []}, playerType: type}), defineEmits: () => () => {},
      useRoute: () => ({query: {}}), useRouter: () => ({}), useAppStore: () => ({}),
      KEY_ROOM_ID: 'room', KEY_CLIENT_ID: 'client', getStorageSync: () => 'tv',
      onMounted: fn => mounted.push(fn), onBeforeUnmount: fn => disposed.push(fn),
      httpVideoSource() {}, startLivePlayback: async () => null,
      addEventHandler: (event, key, callback) => { registeredKey = key; handler = callback },
      removeEventHandler: key => { removedKey = key },
      window: {addEventListener() {}, removeEventListener() {}},
    }, 'player, libmediaRef')
    mounted.forEach(fn => fn())
    await Promise.resolve()
    const video = {seekable: {length: 0}, play: async () => { plays++ }}
    app.player.value = {video, pause: () => { pauses++ }, destroy() {}}
    app.libmediaRef.value = {pause: async () => { pauses++ }, play: async () => { plays++ }}
    assert.equal(typeof handler, 'function', 'live receiver must subscribe to remote commands')
    await handler({event: websocket.ControlEventPause})
    assert.equal(pauses, 1)
    await handler({event: websocket.ControlEventPlay})
    assert.equal(plays, 1)
    disposed.forEach(fn => fn())
    assert.equal(removedKey, registeredKey)
    await handler({event: websocket.ControlEventPause})
    assert.equal(pauses, 1)
  })
}

for (const type of [1, 2, 4]) {
  test(`直播使用设置的播放器 ${type}`, async () => {
    let dpCount = 0
    const dispose = []
    const app = await setup('../src/components/AppPlayLive.vue', {
      ...preference, ...delivery,
      defineProps: () => ({video: {links: []}, playerType: type}), defineEmits: () => () => {},
      useRoute: () => ({query: {}}), useRouter: () => ({}), useAppStore: () => ({}),
      KEY_ROOM_ID: 'room', KEY_CLIENT_ID: 'client', getStorageSync: () => null,
      onMounted: () => {}, onBeforeUnmount: fn => dispose.push(fn),
      httpVideoSource: () => {}, startLivePlayback: async () => ({url: 'https://test/live.m3u8'}),
      DPlayer: class { constructor() { dpCount++ } on() {} destroy() {} },
      setInterval: () => 1, clearInterval: () => {}, window: {removeEventListener() {}},
    }, 'start, option, player, generation, dpRef: typeof dpRef === "undefined" ? null : dpRef, libmediaSession: typeof libmediaSession === "undefined" ? null : libmediaSession')
    if (app.dpRef) app.dpRef.value = {}
    await app.start()
    assert.equal(dpCount, type === 1 ? 1 : 0)
    assert.equal(Boolean(app.option.value), type === 2)
    assert.equal(Boolean(app.libmediaSession?.value), type === 4)
    dispose.forEach(fn => fn())
  })
}

test('Libmedia 直连错误仅回退一次，旧源回调和销毁后的超时不再起效', () => {
  assert.equal(typeof delivery.createLibmediaLiveDelivery, 'function')
  let now = 0
  const loads = []
  let failures = 0
  const controller = delivery.createLibmediaLiveDelivery({
    url: 'direct', proxyUrl: 'proxy', load: session => loads.push(session),
    onMode() {}, onError: () => failures++, now: () => now,
  })
  loads[0].onError()
  assert.deepEqual(loads.map(item => item.url), ['direct', 'proxy'])
  loads[0].onError()
  assert.equal(failures, 0)
  loads[1].onError()
  assert.equal(failures, 1)
  controller.destroy()
  now = 100000
  controller.tick()
  loads[1].onError()
  assert.equal(failures, 1)
})

test('Libmedia 暂停不触发回退，恢复播放后停滞才回退', () => {
  assert.equal(typeof delivery.createLibmediaLiveDelivery, 'function')
  let now = 0
  const loads = []
  const controller = delivery.createLibmediaLiveDelivery({url: 'direct', proxyUrl: 'proxy',
    load: session => loads.push(session), onMode() {}, onError() {}, now: () => now})
  loads[0].onPause()
  now = 60000
  controller.tick()
  assert.equal(loads.length, 1)
  loads[0].onPlay()
  now = 79999
  controller.tick()
  assert.equal(loads.length, 1)
  now = 80000
  controller.tick()
  assert.equal(loads[1].url, 'proxy')
})

test('Libmedia 自动播放受限通过 error 上报时保留播放器等待用户操作', () => {
  let now = 0
  const loads = []
  const controller = delivery.createLibmediaLiveDelivery({url: 'direct', proxyUrl: 'proxy',
    load: session => loads.push(session), onMode() {}, onError: () => assert.fail('not a stream failure'), now: () => now})
  loads[0].onError({code: 'AUTOPLAY_BLOCKED', requiresUserGesture: true})
  now = 60000
  controller.tick()
  assert.equal(loads.length, 1)
})

test('遥控直播切台等待 ACK、去重，失败保留频道，普通点播仍发送快进指令', async () => {
  let ack, reject
  const commands = []
  const app = await setup('../src/views/ControlView.vue', {
    ...sessions, ...websocket, sendControlCommand,
    useRouter: () => ({}), useAppStore: () => ({sourceSecret: 'secret'}),
    useMessage: () => ({warning() {}, info() {}}),
    onMounted() {}, onBeforeMount() {}, onBeforeUnmount() {},
    saveCastSession: session => session,
    sendControlWithAck: (room, context) => { commands.push(context); return new Promise((resolve, fail) => { ack = resolve; reject = fail }) },
  }, 'sendControlHandler, room, clientId, castSession, isPlay, isFullscreen')
  app.room.value = 'tv'
  app.clientId.value = 'phone'
  app.castSession.value = sessions.normalizeCastSession({room: 'tv', vid: 'a', pid: 'a1', source: '电视源', media_kind: 'live',
    channels: [{id: 'a', pid: 'a1', name: '一台'}, {id: 'b', pid: 'b1', name: '二台'}]})
  const pending = app.sendControlHandler({event: websocket.ControlEventForward})
  assert.equal(commands.length, 1)
  assert.equal(commands[0].event, '/ctl_load_Video')
  assert.equal(commands[0].vid, 'b')
  assert.equal(commands[0].pid, 'b1')
  assert.equal(commands[0].mode, 'secret')
  assert.equal(app.castSession.value.vid, 'a')
  await app.sendControlHandler({event: websocket.ControlEventForward})
  assert.equal(commands.length, 1)
  ack()
  await pending
  assert.equal(app.castSession.value.vid, 'b')
  const failed = app.sendControlHandler({event: websocket.ControlEventBack})
  reject(new Error('offline'))
  await failed
  assert.equal(app.castSession.value.vid, 'b')
  const play = app.sendControlHandler({event: websocket.ControlEventPlay})
  ack()
  await play
  assert.equal(app.isPlay.value, true)
  const fullscreen = app.sendControlHandler({event: websocket.ControlEventFullscreen})
  ack()
  await fullscreen
  assert.equal(app.isFullscreen.value, true)
  app.castSession.value = null
  const vod = app.sendControlHandler({event: websocket.ControlEventForward})
  assert.equal(commands.at(-1).event, '/ctl_forward')
  ack()
  await vod
})

test('直播投屏后首次进入遥控页可以直接暂停', async () => {
  const app = await setup('../src/views/ControlView.vue', {
    ...sessions, ...websocket, sendControlCommand,
    useRouter: () => ({}), useAppStore: () => ({}), useMessage: () => ({}),
    onMounted() {}, onBeforeMount() {},
    KEY_ROOM_ID: 'room', KEY_CLIENT_ID: 'client', getStorageSync: () => 'tv',
    loadCastSession: () => ({media_kind: 'live'}),
  }, 'onBeforeMountHandler, isPlay')
  await app.onBeforeMountHandler()
  assert.equal(app.isPlay.value, true)
})

test('直播投屏会话保存当前频道线路，遥控器可选线路且切台清除旧线路', () => {
  const session = sessions.normalizeCastSession(sessions.buildCastSessionCandidate({
    room: 'tv', source: '电视源', current: {id: 'a1', name: '线路一'},
    video: {id: 'a', name: '一台', media_kind: 'live',
      links: [{id: 'a1', name: '线路一'}, {id: 'a2', name: '线路二'}],
      channels: [{id: 'a', pid: 'a1', name: '一台'}, {id: 'b', pid: 'b1', name: '二台'}]},
  }))
  assert.deepEqual(session.episodes, [{id: 'a1', name: '线路一'}, {id: 'a2', name: '线路二'}])
  assert.equal(sessions.shouldShowEpisodeSwitcher(session), true)
  const switched = sessions.updateCastSessionEpisode(session, {id: 'a2'})
  assert.equal(switched.vid, 'a')
  assert.equal(switched.pid, 'a2')
  assert.deepEqual(sessions.updateCastSessionChannel(switched, 'b').episodes, [])
})

test('遥控直播切线路等待 ACK，阻止并发切台，失败保持原线路', async () => {
  let ack, reject
  const commands = []
  const app = await setup('../src/views/ControlView.vue', {
    ...sessions, ...websocket, sendControlCommand,
    useRouter: () => ({}), useAppStore: () => ({sourceSecret: 'secret'}),
    useMessage: () => ({warning() {}, info() {}}), onMounted() {}, onBeforeMount() {},
    saveCastSession: session => session,
    sendControlWithAck: (room, context) => { commands.push(context); return new Promise((resolve, fail) => { ack = resolve; reject = fail }) },
  }, 'switchEpisodeHandler, sendControlHandler, castSession, room, clientId')
  app.room.value = 'tv'
  app.clientId.value = 'phone'
  app.castSession.value = sessions.normalizeCastSession({room: 'tv', vid: 'a', pid: 'a1', source: '电视源', media_kind: 'live',
    episodes: [{id: 'a1', name: '线路一'}, {id: 'a2', name: '线路二'}],
    channels: [{id: 'a', pid: 'a1', name: '一台'}, {id: 'b', pid: 'b1', name: '二台'}]})
  const pending = app.switchEpisodeHandler({id: 'a2'})
  assert.equal(commands.length, 1)
  assert.equal(commands[0].vid, 'a')
  assert.equal(commands[0].pid, 'a2')
  assert.equal(app.castSession.value.pid, 'a1')
  await app.sendControlHandler({event: websocket.ControlEventForward})
  assert.equal(commands.length, 1)
  ack()
  await pending
  assert.equal(app.castSession.value.pid, 'a2')
  const failed = app.switchEpisodeHandler({id: 'a1'})
  reject(new Error('offline'))
  await failed
  assert.equal(app.castSession.value.pid, 'a2')
})

test('遥控器补齐旧直播会话线路，迟到的频道详情不能覆盖新频道', async () => {
  const requests = []
  const app = await setup('../src/views/ControlView.vue', {
    ...sessions, useRouter: () => ({}), useAppStore: () => ({}), useMessage: () => ({}),
    onMounted() {}, onBeforeMount() {}, saveCastSession: session => sessions.normalizeCastSession(session),
    httpVideo: (vid, source) => new Promise(resolve => requests.push({vid, source, resolve})),
  }, 'refreshLiveLines, castSession')
  const old = {room: 'tv', vid: 'a', pid: 'a1', source: '电视源', media_kind: 'live'}
  app.castSession.value = sessions.normalizeCastSession(old)
  const pending = app.refreshLiveLines()
  assert.equal(requests[0].vid, 'a')
  requests[0].resolve({data: {id: 'a', links: [{id: 'a1', name: '线路一'}, {id: 'a2', name: '线路二'}]}})
  await pending
  assert.equal(app.castSession.value.episodes.length, 2)
  const stale = app.refreshLiveLines()
  app.castSession.value = sessions.normalizeCastSession({...old, vid: 'b', pid: 'b1'})
  requests[1].resolve({data: {id: 'a', links: [{id: 'a2', name: '线路二'}]}})
  await stale
  assert.equal(app.castSession.value.vid, 'b')
  assert.deepEqual(app.castSession.value.episodes, [])
})
