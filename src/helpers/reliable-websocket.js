const WebSocketConnecting = 0
const WebSocketOpen = 1
const WebSocketClosing = 2
const WebSocketClosed = 3

export const DefaultSendTimeoutMs = 5000

const createMissingSocketError = () => new Error('WebSocket is unavailable')

export const sendWhenOpen = ({
  getSocket,
  connect,
  payload,
  timeoutMs = DefaultSendTimeoutMs,
}) => {
  let socket

  try {
    socket = getSocket?.()

    if (!socket || socket.readyState === WebSocketClosing || socket.readyState === WebSocketClosed) {
      socket = connect?.() ?? getSocket?.()
    }
  } catch (error) {
    return Promise.reject(error)
  }

  if (!socket) {
    return Promise.reject(createMissingSocketError())
  }

  if (socket.readyState === WebSocketOpen) {
    try {
      socket.send(payload)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  if (socket.readyState !== WebSocketConnecting || typeof socket.addEventListener !== 'function') {
    return Promise.reject(createMissingSocketError())
  }

  return new Promise((resolve, reject) => {
    let settled = false
    let timeoutId

    const cleanup = () => {
      socket.removeEventListener('open', onOpen)
      socket.removeEventListener('error', onError)
      socket.removeEventListener('close', onClose)
      clearTimeout(timeoutId)
    }

    const settle = (callback) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      callback()
    }

    const onOpen = () => {
      settle(() => {
        try {
          socket.send(payload)
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    }
    const onError = () => settle(() => reject(new Error('WebSocket error before send')))
    const onClose = () => settle(() => reject(new Error('WebSocket closed before send')))

    socket.addEventListener('open', onOpen)
    socket.addEventListener('error', onError)
    socket.addEventListener('close', onClose)
    timeoutId = setTimeout(() => {
      settle(() => reject(new Error(`WebSocket send timed out after ${timeoutMs} ms`)))
    }, timeoutMs)
  })
}
