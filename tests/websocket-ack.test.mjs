import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ControllerOfflineMessage,
  createAckRegistry,
  createRequestId,
} from '../src/helpers/websocket-ack.js'

const withFakeTimers = async (callback) => {
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  const timers = []
  globalThis.setTimeout = (handler, delay) => {
    const timer = {handler, delay, cleared: false}
    timers.push(timer)
    return timer
  }
  globalThis.clearTimeout = (timer) => {
    timer.cleared = true
  }
  try {
    await callback(timers)
  } finally {
    globalThis.setTimeout = originalSetTimeout
    globalThis.clearTimeout = originalClearTimeout
  }
}

test('creates opaque non-incrementing request IDs', () => {
  const first = createRequestId()
  const second = createRequestId()
  assert.match(first, /^[A-Za-z0-9_-]{16,}$/)
  assert.notEqual(first, second)
})

test('registers waiter before send and accepts a synchronous ACK', async () => {
  const registry = createAckRegistry({timeoutMs: 5000})
  const requestId = 'request-sync'
  const pending = registry.wait({
    requestId,
    generation: 3,
    send: () => {
      assert.equal(registry.pendingCount(), 1)
      registry.resolve({request_id: requestId, accepted: true}, 3)
    },
  })

  assert.deepEqual(await pending, {request_id: requestId, accepted: true})
  assert.equal(registry.pendingCount(), 0)
})

test('rejects accepted=false with the unified offline message', async () => {
  const registry = createAckRegistry({timeoutMs: 5000})
  const pending = registry.wait({requestId: 'request-false', generation: 1, send() {}})
  assert.equal(registry.resolve({request_id: 'request-false', accepted: false}, 1), true)
  await assert.rejects(pending, new RegExp(ControllerOfflineMessage))
  assert.equal(registry.pendingCount(), 0)
})

test('times out at 5000 ms and clears the entry and timer', async () => {
  await withFakeTimers(async (timers) => {
    const registry = createAckRegistry({timeoutMs: 5000})
    const pending = registry.wait({requestId: 'request-timeout', generation: 1, send() {}})
    assert.equal(timers[0].delay, 5000)
    timers[0].handler()
    await assert.rejects(pending, new RegExp(ControllerOfflineMessage))
    assert.equal(timers[0].cleared, true)
    assert.equal(registry.pendingCount(), 0)
  })
})

test('close or error rejects only its generation and duplicate cleanup is harmless', async () => {
  const registry = createAckRegistry({timeoutMs: 5000})
  const first = registry.wait({requestId: 'old-a', generation: 1, send() {}})
  const second = registry.wait({requestId: 'old-b', generation: 1, send() {}})
  const current = registry.wait({requestId: 'new', generation: 2, send() {}})

  assert.equal(registry.rejectGeneration(1), 2)
  assert.equal(registry.rejectGeneration(1), 0)
  await assert.rejects(first, new RegExp(ControllerOfflineMessage))
  await assert.rejects(second, new RegExp(ControllerOfflineMessage))
  assert.equal(registry.pendingCount(), 1)
  assert.equal(registry.resolve({request_id: 'new', accepted: true}, 1), false)
  assert.equal(registry.resolve({request_id: 'unknown', accepted: true}, 2), false)
  registry.resolve({request_id: 'new', accepted: true}, 2)
  await current
  assert.equal(registry.resolve({request_id: 'new', accepted: true}, 2), false)
  assert.equal(registry.pendingCount(), 0)
})

test('a synchronous send failure rejects and removes the waiter', async () => {
  const registry = createAckRegistry({timeoutMs: 5000})
  const pending = registry.wait({
    requestId: 'send-failure',
    generation: 4,
    send() {
      throw new Error('send failed')
    },
  })
  await assert.rejects(pending, /send failed/)
  assert.equal(registry.pendingCount(), 0)
})

test('an asynchronous send failure rejects once and clears the waiter', async () => {
  const registry = createAckRegistry({timeoutMs: 5000})
  const pending = registry.wait({
    requestId: 'async-send-failure',
    generation: 4,
    send: async () => {
      throw new Error('async send failed')
    },
  })
  await assert.rejects(pending, /async send failed/)
  assert.equal(registry.pendingCount(), 0)
})
