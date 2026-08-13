import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

import {
  createCastingCommandGuard,
  normalizeLoadVideoContext,
  pairController,
  sendCastingCommand,
  sendControlCommand,
} from '../src/helpers/casting.js'

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
    navigate: (path) => calls.push({type: 'navigate', path}),
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].context.mode, '')
  resolveAck({accepted: true})
  await sending
  assert.deepEqual(calls.at(-1), {type: 'navigate', path: '/control'})
})

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
