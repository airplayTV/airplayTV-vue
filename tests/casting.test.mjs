import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

import {saveCastSession} from '@/helpers/cast-session.js'
import {
  createCastingCommandGuard,
  normalizeLoadVideoContext,
  pairController,
  sendCastingCommand,
  sendControlCommand,
} from '@/helpers/casting.js'

test('normalizes load IDs and null mode while retaining extra fields', () => {
  assert.deepEqual(normalizeLoadVideoContext({
    event: '/ctl_load_Video', vid: 7, pid: 8, source: 9, mode: null, extra: true,
  }), {
    event: '/ctl_load_Video', vid: '7', pid: '8', source: '9', mode: '', extra: true,
  })
})

for (const field of ['vid', 'pid', 'source']) {
  test(`rejects an empty ${field}`, () => {
    const context = {vid: 'v', pid: 'p', source: 's', mode: ''}
    context[field] = '   '
    assert.throws(() => normalizeLoadVideoContext(context), /invalid load command/)
  })
}

test('casting awaits accepted ACK before preserving target navigation', async () => {
  const calls = []
  let resolveAck
  const sending = sendCastingCommand({
    room: 'room-a',
    context: {event: '/ctl_load_Video', vid: 1, pid: 2, source: 'source', mode: null},
    sendControl: (room, context) => new Promise((resolve) => {
      calls.push({type: 'send', room, context})
      resolveAck = resolve
    }),
    saveSession: () => ({saved: true}),
    navigate: (path) => calls.push({type: 'navigate', path}),
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].context.mode, '')
  resolveAck({accepted: true})
  await sending
  assert.deepEqual(calls.at(-1), {type: 'navigate', path: '/control'})
})

test('load casting saves its normalized session after ACK and before navigation', async () => {
  const calls = []
  await sendCastingCommand({
    room: 'room-a',
    context: {event: '/ctl_load_Video', vid: 1, pid: 2, source: 'source', mode: 'secret'},
    castSession: {
      room: 'room-a', vid: '1', pid: '2', source: 'source', mode: 'secret',
      title: 'Title', playbackUrl: 'https://secret.test/video',
    },
    sendControl: async () => calls.push('ack'),
    saveSession: (snapshot) => calls.push({type: 'save', snapshot}),
    navigate: () => calls.push('navigate'),
  })
  assert.deepEqual(calls.map((entry) => typeof entry === 'string' ? entry : entry.type), ['ack', 'save', 'navigate'])
  assert.equal(calls[1].snapshot.mode, undefined)
  assert.equal(calls[1].snapshot.playbackUrl, undefined)
  assert.equal(calls[1].snapshot.version, 1)
})

test('load casting rejection leaves the session unsaved and does not navigate', async () => {
  const calls = []
  await assert.rejects(() => sendCastingCommand({
    room: 'room-a',
    context: {event: '/ctl_load_Video', vid: 1, pid: 2, source: 'source'},
    castSession: {room: 'room-a', vid: '1', pid: '2', source: 'source'},
    sendControl: async () => { throw new Error('rejected') },
    saveSession: () => calls.push('save'),
    navigate: () => calls.push('navigate'),
  }), /rejected/)
  assert.deepEqual(calls, [])
})

for (const [name, saveSession] of [
  ['a null result', () => null],
  ['a throwing storage backend', (snapshot) => saveCastSession(snapshot, {setItem: () => { throw new Error('quota') }})],
  ['missing storage', (snapshot) => saveCastSession(snapshot, undefined)],
]) {
  test(`load casting does not navigate when saving returns ${name}`, async () => {
    const calls = []
    await assert.rejects(() => sendCastingCommand({
      room: 'room-a',
      context: {event: '/ctl_load_Video', vid: 1, pid: 2, source: 'source'},
      sendControl: async () => calls.push('ack'),
      saveSession,
      navigate: () => calls.push('navigate'),
    }), /cast session persistence failed/)
    assert.deepEqual(calls, ['ack'])
  })
}

test('casting failure does not navigate', async () => {
  let navigated = false
  await assert.rejects(() => sendCastingCommand({
    room: 'room-a', context: {event: '/ctl_play'},
    sendControl: async () => { throw new Error('offline') },
    navigate: async () => { navigated = true },
  }), /offline/)
  assert.equal(navigated, false)
})

test('control updates state only after ACK and routes failure to callback', async () => {
  const calls = []
  let resolveAck
  const sending = sendControlCommand({
    room: 'room-a', context: {event: '/ctl_pause'},
    sendControl: () => new Promise((resolve) => { resolveAck = resolve; calls.push('send') }),
    updateState: () => calls.push('update'),
    onFailure: () => calls.push('failure'),
  })
  assert.deepEqual(calls, ['send'])
  resolveAck({accepted: true})
  await sending
  assert.deepEqual(calls, ['send', 'update'])

  await sendControlCommand({
    room: 'room-a', context: {event: '/ctl_pause'},
    sendControl: async () => { throw new Error('offline') },
    updateState: () => calls.push('wrong-update'),
    onFailure: () => calls.push('failure'),
  })
  assert.equal(calls.at(-1), 'failure')
})

test('compatibility pair export delegates to Presence and never sends ctl_pair', async () => {
  const calls = []
  await pairController({room: 'room-a', startPresence: async (room) => calls.push(room)})
  assert.deepEqual(calls, ['room-a'])
})

test('guard suppresses a repeated pending action', async () => {
  const guard = createCastingCommandGuard()
  let resolve
  let count = 0
  const first = guard(() => new Promise((done) => { count += 1; resolve = done }))
  assert.equal(await guard(async () => { count += 1 }), undefined)
  assert.equal(count, 1)
  resolve()
  await first
})

test('all four casting entries use the ACK sender, local guard, and keep explicit failure handling', async () => {
  const repoRoot = new URL('..', import.meta.url)
  for (const path of [
    'src/components/AppAudioVideoList.vue',
    'src/components/AppPlayAudio.vue',
    'src/components/AppPlayVideo.vue',
    'src/components/AppSourceList.vue',
  ]) {
    const source = await readFile(new URL(path, repoRoot), 'utf8')
    assert.match(source, /sendControlWithAck/)
    assert.match(source, /createCastingCommandGuard/)
    assert.match(source, /await sendCastingCommand/)
    assert.match(source, /电视未连接，请重新扫码/)
  }
})

test('all four casting entries build and pass only session metadata through the ACK path', async () => {
  const repoRoot = new URL('..', import.meta.url)
  const entryPoints = {
    'src/components/AppAudioVideoList.vue': [
      'video: props.video',
      'current: source',
      'source: tmpSource',
    ],
    'src/components/AppPlayAudio.vue': [
      'video: props.video',
      'current: findLink',
      'source: getAppSource()',
    ],
    'src/components/AppPlayVideo.vue': [
      'video: props.video',
      'current: findLink',
      'source: getAppSource()',
    ],
    'src/components/AppSourceList.vue': [
      'video: props.video',
      'current: source',
      'source: tmpSource',
    ],
  }
  for (const [path, metadataFields] of Object.entries(entryPoints)) {
    const source = await readFile(new URL(path, repoRoot), 'utf8')
    assert.ok(source.includes("import {buildCastSessionCandidate} from '@/helpers/cast-session.js'"))
    const candidateStart = source.indexOf('castSession: buildCastSessionCandidate({')
    const candidateEnd = source.indexOf('          sendControl: sendControlWithAck,', candidateStart)
    assert.notEqual(candidateStart, -1, `${path} must construct castSession`)
    assert.notEqual(candidateEnd, -1, `${path} must pass castSession through the ACK sender`)
    const candidate = source.slice(candidateStart, candidateEnd)
    assert.doesNotMatch(source, /localStorage\s*\./)
    for (const field of metadataFields) assert.ok(candidate.includes(field), `${path} must map ${field}`)
  }

  const [video, sourceList, videoPlayView] = await Promise.all([
    readFile(new URL('src/components/AppVideo.vue', repoRoot), 'utf8'),
    readFile(new URL('src/components/AppSourceList.vue', repoRoot), 'utf8'),
    readFile(new URL('src/views/VideoPlayView.vue', repoRoot), 'utf8'),
  ])
  assert.ok(video.includes('<AppSourceList :source-list="videoSourceList" :vid="video.id" :video="video" />'))
  assert.ok(sourceList.includes("props: ['sourceList', 'vid', 'pid', 'video']"))
  assert.equal(sourceList.includes('const video = ref(null)'), false)
  for (const component of ['AppAudioList', 'AppSourceList']) {
    const start = videoPlayView.indexOf(`<${component}`)
    const end = videoPlayView.indexOf('/>', start)
    assert.notEqual(start, -1, `VideoPlayView must render ${component}`)
    assert.notEqual(end, -1, `VideoPlayView ${component} must have a closing tag`)
    assert.ok(videoPlayView.slice(start, end).includes(':video="video"'), `VideoPlayView ${component} must pass video`)
  }
})

test('scan saves room then waits for Presence before navigating and App rejoins before Presence', async () => {
  const repoRoot = new URL('..', import.meta.url)
  const [join, app] = await Promise.all([
    readFile(new URL('src/views/JoinRoomView.vue', repoRoot), 'utf8'),
    readFile(new URL('src/App.vue', repoRoot), 'utf8'),
  ])
  assert.match(join, /setStorageSync\(KEY_ROOM_ID, tmpRoom\.value\)[\s\S]*await controllerPresence\.start\(tmpRoom\.value\)[\s\S]*router\.value\.push\('\/\?from-join-room'\)/)
  assert.match(join, /ControllerOfflineMessage/)
  assert.match(app, /await joinGroup\(clientId\)[\s\S]*await controllerPresence\.start\(room\)/)
  assert.doesNotMatch(app, /controllerPresence\.refresh\(\)/)
  assert.match(app, /EventNameClose[\s\S]*controllerPresence\.stop\(\)/)
  assert.match(app, /EventNameError[\s\S]*controllerPresence\.stop\(\)/)
})
