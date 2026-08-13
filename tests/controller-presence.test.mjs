import assert from 'node:assert/strict'
import test from 'node:test'

import {createControllerPresence} from '../src/helpers/controller-presence.js'

const createFakeTimers = () => {
  const timers = []
  return {
    setTimeout(handler, delay) {
      const timer = {handler, delay, cleared: false}
      timers.push(timer)
      return timer
    },
    clearTimeout(timer) {
      timer.cleared = true
    },
    timers,
  }
}

test('starts immediately then renews with one 5000 ms loop', async () => {
  const clock = createFakeTimers()
  const calls = []
  const presence = createControllerPresence({
    sendPresence: async (room) => calls.push(room),
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    onRenewalFailure() {},
  })

  await presence.start('room-a')
  assert.deepEqual(calls, ['room-a'])
  assert.equal(clock.timers.length, 1)
  assert.equal(clock.timers[0].delay, 5000)
  await clock.timers[0].handler()
  assert.deepEqual(calls, ['room-a', 'room-a'])
  assert.equal(clock.timers.length, 2)
})

test('same-room start is idempotent and switch clears the old loop', async () => {
  const clock = createFakeTimers()
  const calls = []
  const presence = createControllerPresence({
    sendPresence: async (room) => calls.push(room),
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    onRenewalFailure() {},
  })
  await presence.start('room-a')
  const firstTimer = clock.timers[0]
  await presence.start('room-a')
  assert.deepEqual(calls, ['room-a'])
  await presence.start('room-b')
  assert.equal(firstTimer.cleared, true)
  assert.deepEqual(calls, ['room-a', 'room-b'])
})

test('stop clears timer and prevents a stale callback from rescheduling', async () => {
  const clock = createFakeTimers()
  let count = 0
  const presence = createControllerPresence({
    sendPresence: async () => { count += 1 },
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  })
  await presence.start('room-a')
  const timer = clock.timers[0]
  presence.stop()
  assert.equal(timer.cleared, true)
  await timer.handler()
  assert.equal(count, 1)
  assert.equal(clock.timers.length, 1)
})

test('failed renewal has no overlapping loop and remains refreshable', async () => {
  const clock = createFakeTimers()
  let attempts = 0
  let rejectRenewal
  const presence = createControllerPresence({
    sendPresence: () => {
      attempts += 1
      if (attempts === 2) {
        return new Promise((resolve, reject) => { rejectRenewal = reject })
      }
      return Promise.resolve()
    },
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    onRenewalFailure() {},
  })
  await presence.start('room-a')
  const renewing = clock.timers[0].handler()
  await Promise.resolve()
  assert.equal(attempts, 2)
  assert.equal(clock.timers.length, 1)
  const refreshing = presence.refresh()
  assert.equal(attempts, 2)
  rejectRenewal(new Error('offline'))
  await renewing
  await refreshing
  assert.equal(attempts, 3)
  assert.equal(clock.timers.length, 2)
})

test('initial failure does not schedule and a later refresh retries immediately', async () => {
  const clock = createFakeTimers()
  let attempts = 0
  const presence = createControllerPresence({
    sendPresence: async () => {
      attempts += 1
      if (attempts === 1) throw new Error('offline')
    },
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  })
  await assert.rejects(presence.start('room-a'), /offline/)
  assert.equal(clock.timers.length, 0)
  await presence.refresh()
  assert.equal(attempts, 2)
  assert.equal(clock.timers.length, 1)
})
