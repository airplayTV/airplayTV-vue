import { socketUrl } from '../config'

let isConnecting = false
let _websocket: WebSocket
let _events: any// {"open":{"key1":fn(), "key2":fn2()}}, 同一类型事件支持注册多个回调，key区分
enum EventName {
  Open = 'Open',
  Connect = 'Connect',
  Disconnect = 'Disconnect',
  Close = 'Close',
  Message = 'Message',
  Error = 'Error',
  JoinRoom = 'JoinRoom',
  LeaveRoom = 'LeaveRoom',
}

enum DataEventName {
  EventJoinGroup = 'joinGroup',
  EventSendToClient = 'sendToClient',
  EventLeaveGroup = 'leaveGroup',
  EventSendToGroup = 'sendToGroup',
  EventListGroupClient = 'listGroupClient',
}

enum ControlEvent {
  LoadVideo = '/ctl_load_Video',
  Mute = '/ctl_mute',
  Fullscreen = '/ctl_fullscreen',
  FullscreenExit = '/ctl_fullscreen_exit',
  Qrcode = '/ctl_qrCode',
  Info = '/ctl_info',
  Volume = '/ctl_volume',
  Back = '/ctl_back',
  Play = '/ctl_play',
  Pause = '/ctl_pause',
  Forward = '/ctl_forward',
}

const connect = () => {
  if (_websocket && _websocket.readyState == 1) {
    return
  }
  _websocket = new WebSocket(socketUrl)

  _websocket.onopen = function(event) {
    // console.log('[onOpen]', event)
    delegateEventCallback(EventName.Open, event)
  }
  _websocket.onmessage = function(msg) {
    try {
      const data = JSON.parse(msg.data)
      // console.log('[onMessage]', data)
      switch (data.event) {
        case 'connect':
          delegateEventCallback(EventName.Connect, data)
          break
        default:
          delegateEventCallback(EventName.Message, data)
      }
    } catch (e) {
      console.log('[JSON.parse.Error]', e)
    }

  }
  _websocket.onclose = function(event) {
    // console.log('[onClose]', event)
    delegateEventCallback(EventName.Close, event)
  }
  _websocket.onerror = function(event) {
    // console.log('[onError]', event)
    delegateEventCallback(EventName.Error, event)
  }
}

const delegateFunctionCall = (fn: any, data: any) => {
  if (typeof fn == 'function') {
    fn(data)
  }
}

const delegateEventCallback = (eventName: EventName, data: any) => {
  if (!_events[eventName]) {
    return
  }
  for (const _key in _events[eventName]) {
    _events[eventName][_key](data)
  }
}

const addEventHandler = (eventName: EventName, key: string, callback: any) => {
  _addEventHandler(eventName, key, callback)
}

const removeEventHandler = (key: string) => {
  for (const eventName in _events) {
    for (const _key in _events[eventName]) {
      if (key == _key) {
        delete _events[eventName][_key]
      }
    }
  }
}

const _addEventHandler = (eventName: EventName, key: string, callback: any) => {
  if (key.length <= 0) {
    console.warn(`注册事件key必须为常规字符串：${key}`)
    return
  }
  if (typeof callback != 'function') {
    console.warn(`注册事件回调必须为可调用方法，事件名：${eventName}，key: ${key}`)
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

const send = (data: any) => {
  switch (_websocket.readyState) {
    case 0:// WebSocket.CONNECTING 套接字已创建，但连接尚未打开。
      break
    case 1:// WebSocket.OPEN 连接已打开，准备进行通信。
      _websocket.send(data)
      break
    case 2:// WebSocket.CLOSING 连接正在关闭中。
      break
    case 3:// WebSocket.CLOSED 连接已关闭或无法打开。
      connect()
      break
  }
}

const socketReady = () => {
  return _websocket && _websocket.readyState == 1
}


const joinGroup = (groupName: string) => {
  send(JSON.stringify({
    event: DataEventName.EventJoinGroup,
    data: null,
    group: groupName
  }))
}

const sendControl = (groupName: string, controlContext: Object) => {
  send(JSON.stringify({
    group: groupName,
    event: DataEventName.EventSendToGroup,
    data: controlContext,
  }))
}

export {
  EventName,
  connect,
  joinGroup,
  addEventHandler,
  removeEventHandler,
  socketReady,
  sendControl,
  ControlEvent
}
