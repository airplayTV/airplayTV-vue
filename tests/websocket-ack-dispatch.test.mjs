import assert from 'node:assert/strict'
import test from 'node:test'

class FakeWebSocket {
  static instances = []
  constructor() {
    this.readyState = 1
    this.sent = []
    FakeWebSocket.instances.push(this)
  }
  send(payload) {
    this.sent.push(payload)
  }
}
globalThis.WebSocket = FakeWebSocket

const websocket = await import('../src/helpers/websocket.js')

test('control waiter exists before synchronous ACK and ACK bypasses Message handlers', async () => {
  let ordinaryMessages = 0
  websocket.addEventHandler(websocket.EventNameMessage, 'ack-dispatch', () => {
    ordinaryMessages += 1
  })
  const socket = websocket.connect()
  socket.send = (payload) => {
    const requestId = JSON.parse(payload).data.request_id
    socket.onmessage({data: JSON.stringify({
      event: 'send-to-group-ack',
      data: {request_id: requestId, accepted: true, recipient_count: 1},
    })})
  }
  try {
    const ack = await websocket.sendControlWithAck('room-a', {event: '/ctl_play'})
    assert.equal(ack.accepted, true)
    assert.equal(ordinaryMessages, 0)
  } finally {
    websocket.removeEventHandler('ack-dispatch')
  }
})

test('presence uses its own protocol event and resolves its ACK', async () => {
  const socket = websocket.connect()
  let sent
  socket.send = (payload) => {
    sent = JSON.parse(payload)
    socket.onmessage({data: JSON.stringify({
      event: 'controller-presence-ack',
      data: {request_id: sent.data.request_id, accepted: true, tv_online: true},
    })})
  }
  const ack = await websocket.sendPresenceWithAck('room-a')
  assert.equal(ack.tv_online, true)
  assert.equal(sent.event, 'controller-presence')
  assert.equal(sent.data.group, 'room-a')
})

test('close and error reject the current generation once while reconnect ACK is isolated', async () => {
  const firstSocket = websocket.connect()
  let oldRequestId
  firstSocket.send = (payload) => {
    oldRequestId = JSON.parse(payload).data.request_id
  }
  const first = websocket.sendControlWithAck('room-a', {event: '/ctl_pause'})
  firstSocket.onerror({type: 'error'})
  firstSocket.onclose({type: 'close'})
  await assert.rejects(first, /电视未连接，请重新扫码/)

  firstSocket.readyState = 3
  const secondSocket = websocket.connect()
  let resolveSecondSend
  secondSocket.send = (payload) => {
    const requestId = JSON.parse(payload).data.request_id
    firstSocket.onmessage({data: JSON.stringify({
      event: 'send-to-group-ack', data: {request_id: oldRequestId, accepted: true},
    })})
    resolveSecondSend = () => secondSocket.onmessage({data: JSON.stringify({
      event: 'send-to-group-ack', data: {request_id: requestId, accepted: true, recipient_count: 1},
    })})
  }
  const second = websocket.sendControlWithAck('room-a', {event: '/ctl_play'})
  resolveSecondSend()
  assert.equal((await second).accepted, true)
})
