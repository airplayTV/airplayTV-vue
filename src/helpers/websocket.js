import {socketUrl} from '../config'

let isConnecting = false
let _websocket
let _events // {"open":{"key1":fn(), "key2":fn2()}}, 同一类型事件支持注册多个回调，key区分

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

const connect = () => {
    if (_websocket && _websocket.readyState === 1) {
        return
    }
    _websocket = new WebSocket(socketUrl)

    _websocket.onopen = function (event) {
        // console.log('[onOpen]', event)
        delegateEventCallback(EventNameOpen, event)
    }
    _websocket.onmessage = function (msg) {
        try {
            const data = JSON.parse(msg.data)
            // console.log('[onMessage]', data)
            switch (data.event) {
                case 'connect':
                    delegateEventCallback(EventNameConnect, data)
                    break
                default:
                    delegateEventCallback(EventNameMessage, data)
            }
        } catch (e) {
            console.log('[JSON.parse.Error]', e)
        }
    }
    _websocket.onclose = function (event) {
        // console.log('[onClose]', event)
        delegateEventCallback(EventNameClose, event)
    }
    _websocket.onerror = function (event) {
        // console.log('[onError]', event)
        delegateEventCallback(EventNameError, event)
    }
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

const send = (data) => {
    switch (_websocket.readyState) {
        case 0: // WebSocket.CONNECTING 套接字已创建，但连接尚未打开。
            break
        case 1: // WebSocket.OPEN 连接已打开，准备进行通信。
            _websocket.send(data)
            break
        case 2: // WebSocket.CLOSING 连接正在关闭中。
            break
        case 3: // WebSocket.CLOSED 连接已关闭或无法打开。
            connect()
            break
    }
}

const socketReady = () => {
    return _websocket && _websocket.readyState === 1
}

const joinGroup = (groupName) => {
    send(
        JSON.stringify({
            event: DataEventJoinGroup,
            data: {
                group: groupName
            },
        }),
    )
}

const sendControl = (groupName, controlContext) => {
    send(
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
    sendControl,

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

}
