import {controllerPresence} from './controller-presence.js'
import {normalizeCastSession, saveCastSession} from './cast-session.js'
import {sendControlWithAck} from './websocket.js'

const createMissingRoomError = () => new Error('room required')

export const normalizeLoadVideoContext = (context) => {
  const normalized = {
    ...context,
    vid: String(context?.vid ?? '').trim(),
    pid: String(context?.pid ?? '').trim(),
    source: String(context?.source ?? '').trim(),
    mode: String(context?.mode ?? ''),
  }
  if (!normalized.vid || !normalized.pid || !normalized.source) {
    throw new Error('invalid load command')
  }
  return normalized
}

// Compatibility export: pairing is now service-authoritative Presence, never a raw /ctl_pair.
export const pairController = ({room, startPresence = controllerPresence.start}) => {
  if (!room) return Promise.reject(createMissingRoomError())
  return startPresence(room)
}

export const sendCastingCommand = async ({
  room,
  context,
  sendControl = sendControlWithAck,
  castSession,
  saveSession = saveCastSession,
  navigate,
}) => {
  if (!room) throw createMissingRoomError()
  const command = context?.event === '/ctl_load_Video'
    ? normalizeLoadVideoContext(context)
    : context
  await sendControl(room, command)
  if (command?.event === '/ctl_load_Video') {
    const session = normalizeCastSession({...castSession, ...command, room})
    if (!session) throw new Error('invalid cast session')
    const savedSession = await saveSession(session)
    if (!savedSession) throw new Error('cast session persistence failed')
  }
  await navigate('/control')
}

export const createCastingCommandGuard = () => {
  let isSending = false
  return async (command) => {
    if (isSending) return
    isSending = true
    try {
      return await command()
    } finally {
      isSending = false
    }
  }
}

export const sendControlCommand = async ({
  room,
  context,
  sendControl = sendControlWithAck,
  updateState,
  onFailure,
}) => {
  try {
    if (!room) throw createMissingRoomError()
    await sendControl(room, context)
    updateState?.()
  } catch (error) {
    onFailure?.(error)
  }
}
