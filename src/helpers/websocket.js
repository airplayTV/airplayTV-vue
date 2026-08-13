import {socketUrl} from '../config.js'
import {sendWhenOpen} from './reliable-websocket.js'
import {createAckRegistry, createRequestId} from './websocket-ack.js'

let isConnecting = false
let _websocket
let _events // {"open":{"key1":fn(), "key2":fn2()}}, 同一类型事件支持注册多个回调，key区分
let connectionGeneration = 0
const ackRegistry = createAckRegistry({timeoutMs: 5000})

const EventNameOpen = 'Open'
const EventNameConnect = 'Connect'
const EventNameDisconnect = 'Disconnect'
const EventNameClose = 'Close'
const EventNameMessage = 'Message'
const EventNameError = 'Error'
const EventNameJoinRoom = 'JoinRoom'
const EventNameLeaveRoom = 'LeaveRoom'

const DataEventJoinGroup = 'join-group'
const DataEventSendToClient = 'sendToClient'
const DataEventLeaveGroup = 'leaveGroup'
const DataEventSendToGroup = 'send-to-group'
const DataEventListGroupClient = 'listGroupClient'

const ControlEventLoadVideo = '/ctl_load_Video'
const ControlEventMute = '/ctl_mute'
const ControlEventFullscreen = '/ctl_fullscreen'
const ControlEventFullscreenExit = '/ctl_fullscreen_exit'
const ControlEventQrcode = '/ctl_qrCode'
const ControlEventInfo = '/ctl_info'
const ControlEventVolume = '/ctl_volume'
const ControlEventBack = '/ctl_back'
const ControlEventPlay = '/ctl_play'
const ControlEventPause = '/ctl_pause'
const ControlEventForward = '/ctl_forward'
const ControlEventHistory = '/ctl_history'
const ControlEventPrev = '/ctl_prev'
const ControlEventNext = '/ctl_next'
const ControlEventPair = '/ctl_pair'

const connect = () => {
  if (_websocket && (_websocket.readyState === 0 || _websocket.readyState === 1)) {
    return _websocket
  }
  connectionGeneration += 1
  const socketGeneration = connectionGeneration
  _websocket = new WebSocket(socketUrl)
  const socket = _websocket

  socket.onopen = function (event) {
    // console.log('[onOpen]', event)
    delegateEventCallback(EventNameOpen, event)
  }
  socket.onmessage = function (msg) {
    try {
      const data = JSON.parse(msg.data)
      // console.log('[onMessage]', data)
      switch (data.event) {
        case 'controller-presence-ack':
        case 'send-to-group-ack':
          ackRegistry.resolve(data.data, socketGeneration)
          break
        case 'connect':
          delegateEventCallback(EventNameConnect, data)
          break
        default:
          delegateEventCallback(EventNameMessage, data)
      }
    } catch (e) {
      console.warn('[websocket] invalid message')
    }
  }
  socket.onclose = function (event) {
    ackRegistry.rejectGeneration(socketGeneration)
    // console.log('[onClose]', event)
    delegateEventCallback(EventNameClose, event)
  }
  socket.onerror = function (event) {
    ackRegistry.rejectGeneration(socketGeneration)
    // console.log('[onError]', event)
    delegateEventCallback(EventNameError, event)
  }
  return _websocket
}

const delegateFunctionCall = (fn, data) => {
  if (typeof fn == 'function') {
    fn(data)
  }
}

const delegateEventCallback = (eventName, data) => {
  if (!_events[eventName]) {
    return
  }
  for (const _key in _events[eventName]) {
    _events[eventName][_key](data)
  }
}

const addEventHandler = (eventName, key, callback) => {
  _addEventHandler(eventName, key, callback)
}

const removeEventHandler = (key) => {
  for (const eventName in _events) {
    for (const _key in _events[eventName]) {
      if (key === _key) {
        delete _events[eventName][_key]
      }
    }
  }
}

const _addEventHandler = (eventName, key, callback) => {
  if (key.length <= 0) {
    console.warn('[websocket] invalid event handler key')
    return
  }
  if (typeof callback != 'function') {
    console.warn('[websocket] invalid event handler callback')
  }
  if (!_events) {
    _events = {}
  }
  if (!_events[eventName]) {
    _events[eventName] = {}
  }
  if (!_events[eventName][key]) {
    _events[eventName][key] = callback
  }
}

const send = (data) => {
  return sendWhenOpen({
    getSocket: () => _websocket,
    connect,
    payload: data,
  })
}

const sendWithSocket = (socket, data) => sendWhenOpen({
  getSocket: () => socket,
  connect: () => socket,
  payload: data,
})

const createBoundControlSender = (socket) => (groupName, controlContext) => {
  return sendWithSocket(
    socket,
    JSON.stringify({
      group: groupName,
      event: DataEventSendToGroup,
      data: controlContext,
    }),
  )
}

const sendAckRequest = ({event, groupName, context = {}}) => {
  const {socket, generation} = ensureConnected()
  const requestId = createRequestId()
  const data = {...context, group: groupName, request_id: requestId}
  return ackRegistry.wait({
    requestId,
    generation,
    send: () => sendWithSocket(socket, JSON.stringify({
      group: groupName,
      event,
      data,
    })),
  })
}

const sendControlWithAck = (groupName, controlContext) => sendAckRequest({
  event: DataEventSendToGroup,
  groupName,
  context: controlContext,
})

const sendPresenceWithAck = (groupName) => sendAckRequest({
  event: 'controller-presence',
  groupName,
})

const socketReady = () => {
  return _websocket && _websocket.readyState === 1
}

const getConnectionGeneration = () => connectionGeneration

const ensureConnected = () => {
  const socket = connect()
  return {
    socket,
    generation: connectionGeneration,
    sendControl: createBoundControlSender(socket),
  }
}

const joinGroup = (groupName) => {
  return send(
    JSON.stringify({
      event: DataEventJoinGroup,
      data: {
        group: groupName
      },
    }),
  )
}

const sendControl = (groupName, controlContext) => {
  return send(
    JSON.stringify({
      group: groupName,
      event: DataEventSendToGroup,
      data: controlContext,
    }),
  )
}

export {
  connect,
  joinGroup,
  addEventHandler,
  removeEventHandler,
  socketReady,
  getConnectionGeneration,
  ensureConnected,
  send,
  sendControl,
  sendControlWithAck,
  sendPresenceWithAck,

  EventNameOpen,
  EventNameConnect,
  EventNameDisconnect,
  EventNameClose,
  EventNameMessage,
  EventNameError,
  EventNameJoinRoom,
  EventNameLeaveRoom,

  DataEventJoinGroup,
  DataEventSendToClient,
  DataEventLeaveGroup,
  DataEventSendToGroup,
  DataEventListGroupClient,

  ControlEventLoadVideo,
  ControlEventMute,
  ControlEventFullscreen,
  ControlEventFullscreenExit,
  ControlEventQrcode,
  ControlEventInfo,
  ControlEventVolume,
  ControlEventBack,
  ControlEventPlay,
  ControlEventPause,
  ControlEventForward,
  ControlEventHistory,
  ControlEventPrev,
  ControlEventNext,
  ControlEventPair,

}
