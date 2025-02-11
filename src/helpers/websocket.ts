import { websocketUrl } from '@/config.ts'

let isConnecting = false
let _websocket: WebSocket
let _events: EventsType = {
  connect: () => {
  },
  disConnect: () => {
  }
}

type EventsType = {
  connect: () => void;
  disConnect: () => void;
}


const connect = () => {
  if (_websocket && _websocket.readyState == 1) {
    return
  }
  _websocket = new WebSocket(websocketUrl)

  _websocket.onopen = function(event) {
    console.log('[onOpen]', event)

  }
  _websocket.onmessage = function(msg) {
    try {
      const data = JSON.parse(msg.data)
      console.log('[onMessage]', data)
      switch (data.event) {
        case 'connect':
          delegateFunctionCall(_events.connect, data)
          break
        case 'disConnect':
          delegateFunctionCall(_events.disConnect, data)
          break
      }
    } catch (e) {
      console.log('[JSON.parse.Error]', e)
    }

  }
  _websocket.onclose = function(event) {
    console.log('[onClose]', event)
    setTimeout(connect, 3000)
  }
  _websocket.onerror = function(event) {
    console.log('[onError]', event)
  }
}

const delegateFunctionCall = (fn: any, data: any) => {
  if (typeof fn == 'function') {
    fn(data)
  }
}

const addEventsHandler = (events: any) => {
  console.log('[addEventsHandler]', events)

  const { connect, disConnect } = events
  if (connect) {
    _events.connect = connect
  }
  if (disConnect) {
    _events.disConnect = disConnect
  }
}

const removeEventsHandler = () => {
  _events = {
    connect: () => {
    },
    disConnect: () => {
    }
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


const joinGroup = () => {
  //
}

export { connect, joinGroup, addEventsHandler, removeEventsHandler }
