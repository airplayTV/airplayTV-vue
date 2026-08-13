import assert from 'node:assert/strict'
import test from 'node:test'

import { sendWhenOpen } from '../src/helpers/reliable-websocket.js'

class FakeSocket {
  constructor(readyState) {
    this.readyState = readyState
    this.sent = []
    this.listeners = new Map()
  }

  addEventListener(eventName, listener) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName).add(listener)
  }

  removeEventListener(eventName, listener) {
    this.listeners.get(eventName)?.delete(listener)
  }

  emit(eventName) {
    for (const listener of [...(this.listeners.get(eventName) ?? [])]) {
      listener({ type: eventName })
    }
  }

  send(payload) {
    if (this.readyState !== 1) {
      throw new Error('send called before socket is OPEN')
    }
    this.sent.push(payload)
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0)
  }
}

const withFakeTimers = async (callback) => {
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  const timers = []

  globalThis.setTimeout = (handler, delay) => {
    const timer = { handler, delay, cleared: false }
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

test('OPEN socket synchronously writes once and resolves', async () => {
  const socket = new FakeSocket(1)
  const sending = sendWhenOpen({
    getSocket: () => socket,
    connect: () => socket,
    payload: 'open-payload',
  })

  assert.deepEqual(socket.sent, ['open-payload'])
  await sending
  assert.equal(socket.listenerCount(), 0)
})

test('CONNECTING socket waits for open then writes exactly once and cleans listeners', async () => {
  const socket = new FakeSocket(0)
  const sending = sendWhenOpen({
    getSocket: () => socket,
    connect: () => socket,
    payload: 'connecting-payload',
    timeoutMs: 50,
  })

  assert.deepEqual(socket.sent, [])
  assert.equal(socket.listenerCount(), 3)
  socket.readyState = 1
  socket.emit('open')
  socket.emit('open')

  await sending
  assert.deepEqual(socket.sent, ['connecting-payload'])
  assert.equal(socket.listenerCount(), 0)
})

test('CLOSED socket reconnects once, waits for the returned socket, and writes once', async () => {
  const closedSocket = new FakeSocket(3)
  const reconnectingSocket = new FakeSocket(0)
  let connectCount = 0
  const sending = sendWhenOpen({
    getSocket: () => closedSocket,
    connect: () => {
      connectCount += 1
      return reconnectingSocket
    },
    payload: 'reconnect-payload',
    timeoutMs: 50,
  })

  assert.equal(connectCount, 1)
  assert.equal(reconnectingSocket.listenerCount(), 3)
  reconnectingSocket.readyState = 1
  reconnectingSocket.emit('open')

  await sending
  assert.deepEqual(reconnectingSocket.sent, ['reconnect-payload'])
  assert.equal(reconnectingSocket.listenerCount(), 0)
})

test('uses the exact default 5000 ms timeout and rejects with cleaned listeners', async () => {
  await withFakeTimers(async (timers) => {
    const socket = new FakeSocket(0)
    const sending = sendWhenOpen({
      getSocket: () => socket,
      connect: () => socket,
      payload: 'timeout-payload',
    })

    assert.equal(timers.length, 1)
    assert.equal(timers[0].delay, 5000)
    timers[0].handler()

    await assert.rejects(sending, /timed out/i)
    assert.equal(timers[0].cleared, true)
    assert.equal(socket.listenerCount(), 0)
  })
})

test('rejects on a socket error and removes all temporary listeners and timers', async () => {
  await withFakeTimers(async (timers) => {
    const socket = new FakeSocket(0)
    const sending = sendWhenOpen({
      getSocket: () => socket,
      connect: () => socket,
      payload: 'failure-payload',
    })

    socket.emit('error')

    await assert.rejects(sending, /error/i)
    assert.equal(timers[0].cleared, true)
    assert.equal(socket.listenerCount(), 0)
    assert.deepEqual(socket.sent, [])
  })
})

test('rejects on close and removes all temporary listeners and timers', async () => {
  await withFakeTimers(async (timers) => {
    const socket = new FakeSocket(0)
    const sending = sendWhenOpen({
      getSocket: () => socket,
      connect: () => socket,
      payload: 'close-payload',
    })

    socket.emit('close')

    await assert.rejects(sending, /closed/i)
    assert.equal(timers[0].cleared, true)
    assert.equal(socket.listenerCount(), 0)
    assert.deepEqual(socket.sent, [])
  })
})

test('returns a rejected Promise when getSocket synchronously throws', async () => {
  const sending = sendWhenOpen({
    getSocket: () => {
      throw new Error('lookup failed')
    },
    connect: () => null,
    payload: 'lookup-payload',
  })

  await assert.rejects(sending, /lookup failed/i)
})

test('returns a rejected Promise when connect synchronously throws', async () => {
  const sending = sendWhenOpen({
    getSocket: () => new FakeSocket(3),
    connect: () => {
      throw new Error('connect failed')
    },
    payload: 'connect-payload',
  })

  await assert.rejects(sending, /connect failed/i)
})

test('open wins the open-timeout race with one write and no stale rejection', async () => {
  await withFakeTimers(async (timers) => {
    const socket = new FakeSocket(0)
    const sending = sendWhenOpen({
      getSocket: () => socket,
      connect: () => socket,
      payload: 'race-payload',
      timeoutMs: 1,
    })

    socket.readyState = 1
    socket.emit('open')
    timers[0].handler()

    await sending
    assert.deepEqual(socket.sent, ['race-payload'])
    assert.equal(timers[0].cleared, true)
    assert.equal(socket.listenerCount(), 0)
  })
})
