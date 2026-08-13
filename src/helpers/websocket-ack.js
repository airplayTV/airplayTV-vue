export const ControllerOfflineMessage = '电视未连接，请重新扫码'

const encodeBase64Url = (bytes) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  if (typeof btoa === 'function') {
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const createRequestId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().replaceAll('-', '')
  }
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('secure random generator unavailable')
  }
  return encodeBase64Url(globalThis.crypto.getRandomValues(new Uint8Array(18)))
}

export const createAckRegistry = ({timeoutMs = 5000} = {}) => {
  const pending = new Map()

  const settle = (requestId, settleEntry) => {
    const entry = pending.get(requestId)
    if (!entry) return false
    pending.delete(requestId)
    clearTimeout(entry.timer)
    settleEntry(entry)
    return true
  }

  const wait = ({requestId, generation, send}) => new Promise((resolve, reject) => {
    if (!requestId || pending.has(requestId)) {
      reject(new Error('invalid request id'))
      return
    }

    const entry = {generation, resolve, reject, timer: undefined}
    entry.timer = setTimeout(() => {
      settle(requestId, (current) => current.reject(new Error(ControllerOfflineMessage)))
    }, timeoutMs)
    pending.set(requestId, entry)

    let sending
    try {
      sending = send()
    } catch (error) {
      settle(requestId, (current) => current.reject(error))
      return
    }
    Promise.resolve(sending).catch((error) => {
      settle(requestId, (current) => current.reject(error))
    })
  })

  const resolve = (ack, generation) => {
    const requestId = ack?.request_id
    const entry = pending.get(requestId)
    if (!entry || entry.generation !== generation) return false
    return settle(requestId, (current) => {
      if (ack.accepted === true) current.resolve(ack)
      else current.reject(new Error(ControllerOfflineMessage))
    })
  }

  const rejectGeneration = (generation) => {
    const ids = []
    for (const [requestId, entry] of pending) {
      if (entry.generation === generation) ids.push(requestId)
    }
    for (const requestId of ids) {
      settle(requestId, (entry) => entry.reject(new Error(ControllerOfflineMessage)))
    }
    return ids.length
  }

  return {wait, resolve, rejectGeneration, pendingCount: () => pending.size}
}
