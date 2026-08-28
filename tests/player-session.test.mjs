import test from 'node:test'
import assert from 'node:assert/strict'

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
