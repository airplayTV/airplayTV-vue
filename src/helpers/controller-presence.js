export const createControllerPresence = ({
  intervalMs = 5000,
  sendPresence,
  setTimeout: schedule = globalThis.setTimeout,
  clearTimeout: cancel = globalThis.clearTimeout,
  onRenewalFailure = () => console.warn('[controller-presence] renewal failed'),
}) => {
  let room = ''
  let timer
  let operation
  let lifecycle = 0

  const clearTimer = () => {
    if (timer !== undefined) cancel(timer)
    timer = undefined
  }

  const scheduleNext = (generation) => {
    clearTimer()
    if (!room || generation !== lifecycle) return
    timer = schedule(() => run(generation, false).catch(onRenewalFailure), intervalMs)
  }

  const run = (generation, forceAfterPending) => {
    if (!room || generation !== lifecycle) return Promise.resolve()
    if (operation) {
      return forceAfterPending
        ? operation.catch(() => undefined).then(() => run(lifecycle, false))
        : operation
    }

    const currentRoom = room
    clearTimer()
    operation = Promise.resolve().then(() => sendPresence(currentRoom))
    const current = operation.then(
      (ack) => {
        if (generation === lifecycle && currentRoom === room) scheduleNext(generation)
        return ack
      },
      (error) => { throw error },
    ).finally(() => {
      if (operation === current) operation = undefined
    })
    operation = current
    return current
  }

  const start = (nextRoom) => {
    const normalizedRoom = String(nextRoom ?? '')
    if (!normalizedRoom) return Promise.reject(new Error('room required'))
    if (normalizedRoom === room) {
      if (operation) return operation
      if (timer !== undefined) return Promise.resolve()
      return run(lifecycle, false)
    }
    lifecycle += 1
    room = normalizedRoom
    clearTimer()
    return run(lifecycle, true)
  }

  const refresh = () => {
    if (!room) return Promise.resolve()
    clearTimer()
    return run(lifecycle, true)
  }

  const stop = () => {
    lifecycle += 1
    room = ''
    clearTimer()
  }

  return {start, refresh, stop}
}

export const controllerPresence = createControllerPresence({sendPresence: sendPresenceWithAck})
import {sendPresenceWithAck} from './websocket.js'
