import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

import {
  createLatestOperationGuard,
  mergePlaylistSource,
  runPlayerCommand,
} from '../src/helpers/player-session.js'

test('only the latest source operation remains current', () => {
  const guard = createLatestOperationGuard()
  const first = guard.begin()
  const second = guard.begin()

  assert.equal(guard.isCurrent(first), false)
  assert.equal(guard.isCurrent(second), true)

  guard.invalidate()
  assert.equal(guard.isCurrent(second), false)
})

test('playlist source uses the resolved episode URL as the authority', () => {
  assert.deepEqual(
    mergePlaylistSource(
      {id: 'old', url: 'https://old.example/video.m3u8', type: 'hls'},
      {id: 'new', src: 'https://new.example/video.m3u8', title: 'Episode 2'},
    ),
    {
      id: 'new',
      url: 'https://new.example/video.m3u8',
      type: 'hls',
      src: 'https://new.example/video.m3u8',
      title: 'Episode 2',
    },
  )
})

test('player commands convert rejection into one handled failure', async () => {
  const errors = []
  const expectedError = new Error('fullscreen denied')

  const succeeded = await runPlayerCommand(
    () => Promise.reject(expectedError),
    (error) => errors.push(error),
  )

  assert.equal(succeeded, false)
  assert.deepEqual(errors, [expectedError])
})

test('player commands report success without calling the error handler', async () => {
  const errors = []
  const succeeded = await runPlayerCommand(
    () => Promise.resolve(),
    (error) => errors.push(error),
  )

  assert.equal(succeeded, true)
  assert.deepEqual(errors, [])
})

test('libmedia history resume seeks without starting audible autoplay', async () => {
  const componentSource = await readFile(
    new URL('../src/components/AppPlayVideo.vue', import.meta.url),
    'utf8',
  )
  const readyHandlerStart = componentSource.indexOf('const onLibmediaReady')
  const readyHandlerEnd = componentSource.indexOf('const onLibmediaPlay', readyHandlerStart)
  const readyHandler = componentSource.slice(readyHandlerStart, readyHandlerEnd)
  const seekIndex = readyHandler.indexOf('.seek(')
  const playIndex = readyHandler.indexOf('.play(')

  assert.match(componentSource, /:autoplay="false"/)
  assert.notEqual(seekIndex, -1)
  assert.equal(playIndex, -1)
})
